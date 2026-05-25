import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private validatePasswordStrength(password: string) {
    if (password.length < 8) {
      throw new ConflictException('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new ConflictException('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new ConflictException('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new ConflictException('Password must contain at least one number');
    }
  }

  async register(dto: RegisterDto) {
    this.validatePasswordStrength(dto.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const slug = dto.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization name already taken');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          currency: dto.defaultCurrency || 'PKR',
        },
      });

      const adminRole = await tx.role.create({
        data: {
          organizationId: organization.id,
          name: 'Admin',
          slug: 'admin',
          description: 'Full system access',
          isSystemRole: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          organizationId: organization.id,
          isSuperAdmin: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      return { user, organization };
    });

    const tokens = await this.generateTokens({
      sub: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      isSuperAdmin: true,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        organizationId: result.organization.id,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
      ...tokens,
    };
  }

  private loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  async login(dto: LoginDto) {
    const attemptKey = dto.email.toLowerCase();
    const attempt = this.loginAttempts.get(attemptKey);
    if (attempt) {
      const minutesSince = (Date.now() - attempt.lastAttempt.getTime()) / 60000;
      if (attempt.count >= this.MAX_LOGIN_ATTEMPTS && minutesSince < this.LOCKOUT_MINUTES) {
        throw new UnauthorizedException(
          `Account temporarily locked. Too many failed attempts. Try again in ${Math.ceil(this.LOCKOUT_MINUTES - minutesSince)} minutes.`,
        );
      }
      if (minutesSince >= this.LOCKOUT_MINUTES) {
        this.loginAttempts.delete(attemptKey);
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user || user.deletedAt) {
      this.recordFailedAttempt(attemptKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      this.recordFailedAttempt(attemptKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.loginAttempts.delete(attemptKey);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isSuperAdmin: user.isSuperAdmin,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        isSuperAdmin: user.isSuperAdmin,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens({
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        isSuperAdmin: user.isSuperAdmin,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: true,
            branch: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
      roles: user.userRoles.map((ur) => ({
        role: { id: ur.role.id, name: ur.role.name, slug: ur.role.slug },
        branch: ur.branch
          ? { id: ur.branch.id, name: ur.branch.name, code: ur.branch.code }
          : null,
      })),
    };
  }

  private recordFailedAttempt(email: string) {
    const existing = this.loginAttempts.get(email);
    this.loginAttempts.set(email, {
      count: (existing?.count || 0) + 1,
      lastAttempt: new Date(),
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    this.validatePasswordStrength(newPassword);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async getActiveSessions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true, email: true },
    });
    return {
      currentSession: { lastLogin: user?.lastLoginAt, email: user?.email },
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...payload }),
      this.jwtService.signAsync(
        { ...payload },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
