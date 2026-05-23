import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Set up your organization and start managing your rice business
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
