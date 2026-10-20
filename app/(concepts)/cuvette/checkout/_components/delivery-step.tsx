"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { COUNTRIES, cutoffIn, eta, formatCountdown, formatWindow, shippingCost, type Country, type Method } from "../../_lib/delivery";
import { price } from "../../_lib/format";
import { dispatchWords } from "../../_components/bag/dispatch";
import { useNow } from "../../_components/bag/use-now";
import { COUNTRY_CODES, deliverySchema, type Delivery, type DeliveryInput } from "../_lib/schema";
import { FIELD, TextField } from "./text-field";

const COUNTRY_ITEMS = COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRIES[code].name }));

const resolver: Resolver<DeliveryInput, unknown, Delivery> = (values, context, options) =>
  zodResolver(deliverySchema(values.country))(values, context, options);

type Props = {
  defaults: DeliveryInput;
  goods: number;
  onPreview: (country: Country, method: Method) => void;
  onDone: (delivery: Delivery) => void;
};

export function DeliveryForm({ defaults, goods, onPreview, onDone }: Props) {
  const { register, control, handleSubmit, formState, trigger, getFieldState } = useForm<DeliveryInput, unknown, Delivery>({
    resolver,
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { errors } = formState;
  const [country, method] = useWatch({ control, name: ["country", "method"] });

  useEffect(() => onPreview(country, method), [country, method, onPreview]);

  useEffect(() => {
    if (getFieldState("postcode").isTouched) void trigger("postcode");
  }, [country, trigger, getFieldState]);

  return (
    <form onSubmit={handleSubmit(onDone)} noValidate className="space-y-9">
      <fieldset className="space-y-5">
        <legend className="sr-only">Delivery address</legend>
        <CountryField control={control} error={errors.country?.message} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <TextField label="Address" autoComplete="address-line1" error={errors.line1?.message} {...register("line1")} />
        <TextField label="Flat, floor, building" optional autoComplete="address-line2" error={errors.line2?.message} {...register("line2")} />
        <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <TextField
            label="Postcode"
            autoComplete="postal-code"
            autoCapitalize="characters"
            spellCheck={false}
            hint={`Like ${COUNTRIES[country].example}`}
            error={errors.postcode?.message}
            {...register("postcode")}
          />
          <TextField label="Town or city" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        </div>
        <TextField
          label="Phone"
          optional
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          hint="Only for the courier, if they can't find the door."
          error={errors.phone?.message}
          {...register("phone")}
        />
      </fieldset>

      <MethodField control={control} country={country} goods={goods} />

      <Button type="submit" className="h-12 w-full font-normal sm:w-auto sm:px-10">
        Continue to payment
      </Button>
    </form>
  );
}

type ControlProp = ReturnType<typeof useForm<DeliveryInput, unknown, Delivery>>["control"];

function CountryField({ control, error }: { control: ControlProp; error?: string }) {
  const id = useId();
  return (
    <Controller
      control={control}
      name="country"
      render={({ field }) => (
        <Field data-invalid={!!error} className="gap-1.5">
          <FieldLabel htmlFor={id} className="text-sm font-normal">
            Country
          </FieldLabel>
          <Select items={COUNTRY_ITEMS} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
            <SelectTrigger id={id} ref={field.ref} onBlur={field.onBlur} aria-invalid={!!error} className={cn(FIELD, "w-full justify-between data-[size=default]:h-12")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="min-h-11 text-[0.95rem]">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <FieldError>{error}</FieldError>}
        </Field>
      )}
    />
  );
}

function MethodField({ control, country, goods }: { control: ControlProp; country: Country; goods: number }) {
  const now = useNow();
  const left = now && cutoffIn(now);
  const options: { value: Method; name: string; carrier: string }[] = [
    { value: "standard", name: "Standard", carrier: "CTT, tracked" },
    { value: "express", name: "Express", carrier: country === "PT" ? "Next working day" : "2 working days" },
  ];
  return (
    <fieldset>
      <legend className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[0.95rem] font-medium">Delivery method</span>
        {now && (
          <span className="text-sm text-muted-foreground">
            {left !== null ? `Order in ${formatCountdown(left)} to leave Porto today` : `Leaves Porto ${dispatchWords(eta(country, "standard", now).dispatch, now)}`}
          </span>
        )}
      </legend>
      <Controller
        control={control}
        name="method"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={(value) => field.onChange(value)} inputRef={field.ref} className="mt-3 gap-0 border border-(--paper-field)">
            {options.map((option) => {
              const cost = shippingCost(country, option.value, goods);
              return (
                <label
                  key={option.value}
                  className="flex min-h-18 cursor-pointer items-center gap-4 border-(--paper-line) px-4 py-3.5 not-first:border-t has-data-checked:bg-(--paper-2)"
                >
                  <RadioGroupItem value={option.value} className="size-4.5 border-(--paper-field)" />
                  <span className="flex-1">
                    <span className="block text-[0.95rem]">
                      {option.name} <span className="text-muted-foreground">· {option.carrier}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{now ? `Arrives ${formatWindow(eta(country, option.value, now))}` : " "}</span>
                  </span>
                  <span className="text-[0.95rem]">{cost === 0 ? "Free" : price(cost)}</span>
                </label>
              );
            })}
          </RadioGroup>
        )}
      />
    </fieldset>
  );
}
