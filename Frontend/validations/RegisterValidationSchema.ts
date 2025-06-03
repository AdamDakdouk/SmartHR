import * as Yup from "yup";

export const userInfoValidationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  // dob: Yup.date().required('Date of Birth is required'),
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export const passwordCreationValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password is too short")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});
