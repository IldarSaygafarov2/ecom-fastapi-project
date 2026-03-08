import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

import { getApiErrorMessage } from "@/api/error"
import { useAuth } from "@/features/auth/use-auth"

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  return (
    <section className="card">
      <h1>Create account</h1>
      <form
        className="form"
        onSubmit={handleSubmit(async (values) => {
          try {
            await auth.register(values.email, values.password, values.fullName)
            navigate("/shop")
          } catch (error) {
            setError("root", { message: getApiErrorMessage(error) })
          }
        })}
      >
        <input placeholder="Email" type="email" {...register("email")} />
        {errors.email && <span className="error">{errors.email.message}</span>}
        <input placeholder="Password" type="password" {...register("password")} />
        {errors.password && <span className="error">{errors.password.message}</span>}
        <input placeholder="Full name" {...register("fullName")} />
        {errors.root && <span className="error">{errors.root.message}</span>}
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Loading..." : "Register"}
        </button>
      </form>
    </section>
  )
}
