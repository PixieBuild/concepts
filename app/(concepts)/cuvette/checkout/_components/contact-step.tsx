"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { contactSchema, type Contact } from "../_lib/schema";
import { TextField } from "./text-field";

export function ContactForm({ defaults, onDone }: { defaults: Contact; onDone: (contact: Contact) => void }) {
  const { register, control, handleSubmit, formState } = useForm<Contact>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onDone)} noValidate className="space-y-5">
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        error={formState.errors.email?.message}
        hint="For the receipt and the CTT tracking link."
        {...register("email")}
      />
      <Controller
        control={control}
        name="optIn"
        render={({ field }) => (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.95rem]">
            <Checkbox checked={field.value} onCheckedChange={(on) => field.onChange(on)} inputRef={field.ref} className="size-4.5 rounded-[2px] border-(--paper-field)" />
            Email me about new lots
          </label>
        )}
      />
      <Button type="submit" className="h-12 w-full font-normal sm:w-auto sm:px-10">
        Continue to delivery
      </Button>
    </form>
  );
}
