import * as Yup from "yup";
export const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email()
   .required("Username or Email is required"),
  password: Yup.string()
    .min(8, "Password is too short")
    .required("Password is required"),
});
