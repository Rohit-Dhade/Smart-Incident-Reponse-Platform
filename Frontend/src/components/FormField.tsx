import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface BaseFieldProps {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
}

type TextFieldProps = BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
    trailing?: ReactNode;
  };

export function TextField({
  label,
  hint,
  error,
  id,
  trailing,
  className = "",
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="field__control">
        <input
          {...rest}
          id={fieldId}
          className={`input ${trailing ? "input--with-action" : ""} ${
            error ? "input--invalid" : ""
          }`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
        />
        {trailing ? <div className="field__action">{trailing}</div> : null}
      </div>
      {error ? (
        <p
          id={messageId}
          className="field__message field__message--error"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="field__message">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  hint,
  error,
  id,
  ...rest
}: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <TextField
      {...rest}
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}

type TextAreaFieldProps = BaseFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className = "",
  ...rest
}: TextAreaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <textarea
        {...rest}
        id={fieldId}
        className={`input textarea ${error ? "input--invalid" : ""}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
      />
      {error ? (
        <p
          id={messageId}
          className="field__message field__message--error"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="field__message">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = BaseFieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
    children: ReactNode;
  };

export function SelectField({
  label,
  hint,
  error,
  id,
  className = "",
  children,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="field__control">
        <select
          {...rest}
          id={fieldId}
          className={`input select ${error ? "input--invalid" : ""}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
        >
          {children}
        </select>
      </div>
      {error ? (
        <p
          id={messageId}
          className="field__message field__message--error"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="field__message">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
