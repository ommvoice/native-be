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
