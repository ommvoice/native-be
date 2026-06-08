import * as yup from "yup";

export const createChildSchema = yup.object({
  parentId: yup.string().required("ParentId is required"),
  children: yup
    .array()
    .of(
      yup.object({
        nameOrNickName: yup
          .string()
          .required("Child name or nickname is required"),

        dateOfBirth: yup.string().required("Child date of birth is required"),
      }),
    )
    .optional(),
});

export const updateChildSchema = yup
  .object({
    nameOrNickName: yup
      .string()
      .trim()
      .min(1, "Child name or nickname cannot be empty")
      .optional(),
    dateOfBirth: yup.string().optional(),
  })
  .test(
    "at-least-one",
    "Provide at least one of nameOrNickName or dateOfBirth",
    (value) => {
      const hasName = value?.nameOrNickName != null && value.nameOrNickName !== "";
      const hasDob = value?.dateOfBirth != null && value.dateOfBirth !== "";
      return hasName || hasDob;
    },
  )
  .test("dob-valid", "dateOfBirth must be a valid date", (value) => {
    if (value?.dateOfBirth == null || value.dateOfBirth === "") return true;
    const d = new Date(value.dateOfBirth);
    return !Number.isNaN(d.getTime());
  });

export type UpdateChildBody = yup.InferType<typeof updateChildSchema>;
