import { ReactNode } from "react";

interface Props {
  title: string | ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  error?: string | null;
}

export function PageShell({ title, description, action, children, error }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-300">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 mt-1 dark:text-gray-400">
                {description}
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
