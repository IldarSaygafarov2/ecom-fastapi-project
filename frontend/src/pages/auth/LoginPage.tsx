import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

import { getApiErrorMessage } from "@/api/error"
import { useAuth } from "@/features/auth/use-auth"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(3),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <section className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 className="page-title">Sign in</h1>
      <p className="section-desc">Enter your credentials to access your account</p>
      <form
        className="form"
        onSubmit={handleSubmit(async (values) => {
          try {
            await auth.login(values.email, values.password)
            navigate("/")
          } catch (error) {
            setError("root", { message: getApiErrorMessage(error) })
          }
        })}
      >
        <input placeholder="Email" type="email" {...register("email")} />
        {errors.email && <span className="error">{errors.email.message}</span>}
        <input placeholder="Password" type="password" {...register("password")} />
        {errors.password && <span className="error">{errors.password.message}</span>}
        {errors.root && <span className="error">{errors.root.message}</span>}
        <button className="btn" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Loading..." : "Login"}
        </button>
      </form>
    </section>
  )
}
