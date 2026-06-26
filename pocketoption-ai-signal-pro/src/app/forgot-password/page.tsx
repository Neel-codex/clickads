import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { SimpleActionForm } from '@/components/auth/simple-action-form';
import { forgotPasswordAction } from '@/app/actions/auth';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <SimpleActionForm
        action={forgotPasswordAction}
        submitLabel="Send reset link"
        fields={[
          { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
        ]}
      />
    </AuthShell>
  );
}
