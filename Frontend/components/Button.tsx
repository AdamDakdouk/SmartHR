import React from 'react';
import {Text, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import COLORS from '../theme/colors';

// Define a TypeScript interface for the component props
interface ButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  color = COLORS.blue,
  filled = true,
  style,
}) => {
  const bgColor = filled ? color : COLORS.white;
  const textColor = filled ? COLORS.white : COLORS.blue;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor: filled ? color : COLORS.blue,
        },
        style,
      ]}
      onPress={onPress}>
      <Text style={[styles.text, {color: textColor}]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16, // Updated for consistency and clarity
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Button;