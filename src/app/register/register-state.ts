export type RegisterFieldErrors = Readonly<
  Partial<Record<"confirmPassword" | "email" | "password", string>>
>

export type RegisterFormState = Readonly<{
  fieldErrors?: RegisterFieldErrors
  message?: string
  status: "idle" | "error" | "check_email"
}>

export const initialRegisterFormState: RegisterFormState = { status: "idle" }
