import React from "react";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + error wrapper shared by every field on the dark contact form.
 * The error row is always reserved so validation never shifts the layout.
 */
function FieldShell({
  label,
  htmlFor,
  required,
  error,
  className = "",
  children,
}: FieldShellProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[13px] font-bold text-white"
      >
        {label}
        {required && " *"}
      </label>

      {children}

      <div className="min-h-[20px] pt-1">
        {error && (
          <p role="alert" className="text-xs font-medium text-[#ff8080]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** Shared control styling - dark fill, hairline border, red focus ring */
const controlClasses = (hasError: boolean) =>
  `w-full rounded-lg border bg-[#2c3849] px-4 py-3.5 text-sm text-white
   placeholder:text-[#8e99a9] transition-colors
   focus:outline-none focus:ring-2 focus:ring-[#ef4444]/60
   disabled:cursor-not-allowed disabled:opacity-60
   ${hasError ? "border-[#ff8080]" : "border-white/10 hover:border-white/20"}`;

interface ContactInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  wrapperClassName?: string;
}

export const ContactInput = React.forwardRef<
  HTMLInputElement,
  ContactInputProps
>(({ label, error, required, wrapperClassName, id, name, ...props }, ref) => {
  const fieldId = id || name || label;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      className={wrapperClassName}
    >
      <input
        ref={ref}
        id={fieldId}
        name={name}
        aria-invalid={!!error}
        className={controlClasses(!!error)}
        {...props}
      />
    </FieldShell>
  );
});

ContactInput.displayName = "ContactInput";

interface ContactTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  wrapperClassName?: string;
}

export const ContactTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ContactTextareaProps
>(({ label, error, required, wrapperClassName, id, name, ...props }, ref) => {
  const fieldId = id || name || label;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        name={name}
        aria-invalid={!!error}
        className={`${controlClasses(!!error)} resize-y`}
        {...props}
      />
    </FieldShell>
  );
});

ContactTextarea.displayName = "ContactTextarea";
