import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

interface PasswordCreationFormProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: { [key: string]: string };
}

const PasswordCreationForm: React.FC<PasswordCreationFormProps> = ({
  values,
  setFieldValue,
  errors,
}) => {
  return (
    <View>
      <TextInput
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="Enter your password"
        value={values.password}
        secureTextEntry
        onChangeText={(text) => setFieldValue("password", text)}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <TextInput
        style={[
          styles.input,
          errors.confirmPassword ? styles.inputError : null,
        ]}
        placeholder="Confirm your password"
        value={values.confirmPassword}
        secureTextEntry
        onChangeText={(text) => setFieldValue("confirmPassword", text)}
      />
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
});

export default PasswordCreationForm;
