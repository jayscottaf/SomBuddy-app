import { Link } from "wouter";
import { Container } from "../ui/container";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: "login" | "register";
}

export function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Container className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <a className="inline-block">
              <h1 className="text-3xl font-bold text-primary-600 font-heading">SomBuddy</h1>
            </a>
          </Link>
          <h2 className="mt-6 text-2xl font-heading font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>
      </Container>

      <Container className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
        
        <div className="mt-6 text-center">
          {type === "login" ? (
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/register">
                <a className="font-medium text-primary-600 hover:text-primary-500">
                  Sign up
                </a>
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login">
                <a className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </a>
              </Link>
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
