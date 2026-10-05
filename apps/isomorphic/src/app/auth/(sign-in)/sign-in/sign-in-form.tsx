'use client';

import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { useState, useEffect, useMemo } from 'react';
import { Input, Button, Password, Checkbox, Text } from 'rizzui';
import { useMedia } from '@core/hooks/use-media';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { loginSchema, LoginSchema } from '@/validators/login.schema';
import { useAuth } from '@/app/lib/hooks/useAuth';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecaptcha } from '@/app/lib/hooks/useRecaptcha';

const initialValues: LoginSchema = {
  email: '',
  password: '',
  rememberMe: true,
};

export default function SignInForm() {
  const isMedium = useMedia('(max-width: 1200px)', false);
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isEnabled: isCaptchaEnabled, isReady: isCaptchaReady, error: captchaError, execute } = useRecaptcha();

  const callbackUrl = useMemo(() => {
    const callback = searchParams.get('callbackUrl');
    if (!callback || callback === '%2F') return '/';
    return callback.startsWith('/') ? callback : '/';
  }, [searchParams]);

  const defaultValues = useMemo<LoginSchema>(
    () => ({
      ...initialValues,
      email: searchParams.get('email') || initialValues.email,
    }),
    [searchParams]
  );

  // Redirect to root if user is already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [callbackUrl, session, status, router]);

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    setError(null);

    let captchaToken: string | undefined;
    if (isCaptchaEnabled) {
      if (!isCaptchaReady) {
        setError('Security check is still loading. Please wait and try again.');
        return;
      }
      try {
        const result = await execute('sign_in');
        captchaToken = result.token;
      } catch {
        setError('Unable to complete Google reCAPTCHA verification.');
        return;
      }
    }

    // This application uses JWT authentication only
    // No API keys are needed for login
    const res = await login({
      email: data.email,
      password: data.password,
      redirectTo: callbackUrl,
      captchaToken,
    });

    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <>
      <Form<LoginSchema>
        validationSchema={loginSchema}
        onSubmit={onSubmit}
        useFormProps={{
          mode: 'onChange',
          defaultValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5">
            <Input
              type="email"
              size={isMedium ? 'lg' : 'xl'}
              label="Email"
              placeholder="Enter your email"
              rounded="pill"
              className="[&>label>span]:font-medium focus:bg-green-100 focus:border-green-500 transition-colors duration-200"
              {...register('email')}
              error={errors.email?.message}
            />
            <Password
              label="Password"
              placeholder="Enter your password"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              className="[&>label>span]:font-medium focus:bg-green-100 focus:border-green-500 transition-colors duration-200"
              {...register('password')}
              error={errors.password?.message}
            />
            <div className="flex items-center justify-between pb-2">
              <Checkbox
                {...register('rememberMe')}
                label="Remember Me"
                variant="flat"
                className="[&>label>span]:font-medium"
              />
              <Link
                href={routes.auth.forgotPassword}
                className="h-auto p-0 text-sm font-semibold text-blue underline transition-colors hover:text-gray-900 hover:no-underline"
              >
                Forget Password?
              </Link>
            </div>

            {/* Display error if exists */}
            {error && (
              <Text className="text-center text-sm text-red-600">{error}</Text>
            )}
            {captchaError && (
              <Text className="text-center text-xs text-red-500">{captchaError}</Text>
            )}
            {isCaptchaEnabled && (
              <Text className="text-center text-xs text-gray-500">
                Protected by Google reCAPTCHA.
              </Text>
            )}

            <Button
              className="border-primary-light w-full border-2 text-base font-bold"
              type="submit"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        )}
      </Form>

      <Text className="mt-5 text-center text-[15px] leading-loose text-gray-500 lg:text-start xl:mt-7 xl:text-base">
        Don’t have an account?{' '}
        <Link
          href={`${routes.auth.signUp2}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-gray-700 transition-colors hover:text-blue"
        >
          Create Account
        </Link>
      </Text>
    </>
  );
}
