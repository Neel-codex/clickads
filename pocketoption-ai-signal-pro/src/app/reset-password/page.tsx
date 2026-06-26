import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { SimpleActionForm } from '@/components/auth/simple-action-form';
import { resetPasswordAction } from '@/app/actions/auth';

export const metadata: Metadata = { title: 'Set new password' };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
    >
      <SimpleActionForm
        action={resetPasswordAction}
        submitLabel="Update password"
        fields={[
          { name: 'password', label: 'New password', type: 'password', placeholder: '••••••••' },
          { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
        ]}
      />
    </AuthShell>
  );
}
