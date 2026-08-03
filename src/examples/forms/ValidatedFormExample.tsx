import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FormSection, SearchableSelect, MultiSelect } from "@/components/forms"

// Schema definition using Zod
const formSchema = z.object({
  exampleName: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  exampleEmail: z.string().email({
    message: "Por favor, ingresa un correo electrónico válido.",
  }),
  exampleCategory: z.string().min(1, {
    message: "Por favor, selecciona una categoría.",
  }),
  exampleDescription: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
  exampleSearchable: z.string().min(1, {
    message: "Por favor, selecciona una etiqueta técnica.",
  }),
  exampleMulti: z.array(z.string()).min(1, {
    message: "Selecciona al menos una habilidad técnica.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function ValidatedFormExample() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exampleName: "",
      exampleEmail: "",
      exampleCategory: "",
      exampleDescription: "",
      exampleSearchable: "",
      exampleMulti: [],
    },
  })

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true)
    console.log("Form Data Submitted:", data)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMessage("Formulario validado y enviado localmente con éxito.")
      reset()
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <FormSection
        title="Ejemplo Técnico de Validación"
        description="Este formulario demuestra la integración de React Hook Form + Zod con los componentes Field y UI de la plataforma."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="Nombre de Ejemplo"
            required
            error={errors.exampleName?.message}
          >
            <Input 
              placeholder="Ej. Juan Pérez" 
              {...register("exampleName")}
            />
          </Field>

          <Field
            label="Correo de Prueba"
            required
            error={errors.exampleEmail?.message}
          >
            <Input 
              placeholder="correo@ejemplo.com" 
              {...register("exampleEmail")}
            />
          </Field>

          <Field
            label="Categoría"
            required
            error={errors.exampleCategory?.message}
          >
            <Controller
              name="exampleCategory"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opcion-1">Opción Técnica 1</SelectItem>
                    <SelectItem value="opcion-2">Opción Técnica 2</SelectItem>
                    <SelectItem value="opcion-3">Opción Técnica 3</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="Etiqueta Técnica (Buscable)"
            required
            error={errors.exampleSearchable?.message}
            description="Ejemplo de selección con búsqueda interna."
          >
            <Controller
              name="exampleSearchable"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={[
                    { value: "tag-1", label: "React", description: "Biblioteca de UI" },
                    { value: "tag-2", label: "TypeScript", description: "Tipado estático" },
                    { value: "tag-3", label: "Tailwind", description: "CSS utilitario" },
                    { value: "tag-4", label: "Shadcn", description: "Componentes base" },
                    { value: "tag-5", label: "Radix", description: "Primitivos accesibles", disabled: true },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Busca una tecnología..."
                />
              )}
            />
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Descripción Técnica"
              required
              error={errors.exampleDescription?.message}
              description="Ingresa al menos 10 caracteres para validar el campo."
            >
              <Textarea 
                placeholder="Escribe aquí la descripción del ejemplo..." 
                {...register("exampleDescription")}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field
              label="Habilidades Técnicas (Múltiple)"
              required
              error={errors.exampleMulti?.message}
              description="Selecciona una o más tecnologías para validar el campo."
            >
              <Controller
                name="exampleMulti"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={[
                      { value: "react", label: "React", description: "UI Library" },
                      { value: "nextjs", label: "Next.js", description: "Framework" },
                      { value: "typescript", label: "TypeScript", description: "Language" },
                      { value: "tailwindcss", label: "Tailwind CSS", description: "Styling" },
                      { value: "shadcn", label: "Shadcn UI", description: "Components" },
                    ]}
                    value={field.value as string[]}
                    onValueChange={field.onChange}
                    placeholder="Selecciona habilidades..."
                  />
                )}
              />
            </Field>
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <div className="text-sm">
              {successMessage && (
                <p className="text-positive font-medium animate-in fade-in slide-in-from-left-2">
                  {successMessage}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Validar Formulario"}
            </Button>
          </div>
        </form>
      </FormSection>
    </div>
  )
}
