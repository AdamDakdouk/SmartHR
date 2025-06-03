import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLORS from '../theme/colors';

interface CheckboxProps {
  isChecked: boolean;
  setIsChecked: any;
}
const CustomCheckbox: React.FC<CheckboxProps> = ({isChecked, setIsChecked}) => {
  return (
    <TouchableOpacity
      onPress={() => setIsChecked(!isChecked)}
      style={{marginRight: 8}}>
      {isChecked ? (
        <Ionicons name="checkbox" size={24} color={COLORS.primary} />
      ) : (
        <Ionicons name="square-outline" size={24} color={COLORS.grey} />
      )}
    </TouchableOpacity>
  );
};
export default CustomCheckbox;