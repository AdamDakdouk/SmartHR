import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

interface UserInfoFormProps {
  values: { [key: string]: any };
  setFieldValue: (field: string, value: any) => void; // Use setFieldValue for direct updates
  errors: { [key: string]: string };
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
  values,
  setFieldValue,
  errors,
}) => {
  return (
    <View>
      <TextInput
        style={[styles.input, errors.firstName ? styles.inputError : null]}
        placeholder="Enter your first name"
        value={values.firstName}
        onChangeText={(text) => setFieldValue("firstName", text)}
      />
      {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

      <TextInput
        style={[styles.input, errors.lastName ? styles.inputError : null]}
        placeholder="Enter your last name"
        value={values.lastName}
        onChangeText={(text) => setFieldValue("lastName", text)}
      />
      {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

      <TextInput
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="Enter your email"
        value={values.email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(text) => setFieldValue("email", text)}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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

export default UserInfoForm;
