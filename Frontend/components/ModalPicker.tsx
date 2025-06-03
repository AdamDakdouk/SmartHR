import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme"; // import color scheme hook

interface ModalPickerProps {
  onChange: (value: string) => void;
  selectedValue: string;
  placeholder?: string;
  list: { id?: number | string; name: string }[];
}

const ModalPicker: React.FC<ModalPickerProps> = ({
  onChange,
  selectedValue,
  placeholder = "Select an Option",
  list,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(
    list.find((item) => item.id === selectedValue)?.name || ""
  );

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"]; // select theme colors

  const handlePickerChange = (itemValue: any) => {
    const selectedItem = list.find((item) => item.id === itemValue);

    if (selectedItem) {
      const numericValue = Number(itemValue);
      if (!isNaN(numericValue)) {
        setSelectedLabel(selectedItem.name);
        onChange(itemValue);
      }
    }
    setModalVisible(false);
  };

  const isPlaceholder = selectedLabel === "";

  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.input,
          {
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.borderColor,
          },
        ]}
      >
        <Text
          style={
            isPlaceholder
              ? [styles.placeholder, { color: themeColors.icon }]
              : [styles.text, { color: themeColors.text }]
          }
        >
          {isPlaceholder ? placeholder : selectedLabel}
        </Text>
      </TouchableOpacity>
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Picker
              selectedValue={selectedValue}
              onValueChange={handlePickerChange}
            >
              {list.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))}
            </Picker>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[
                styles.closeButton,
                { backgroundColor: themeColors.icon },
              ]}
            >
              <Text style={{ color: themeColors.buttonText }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 30,
    paddingVertical: 10,
  },
  placeholder: {
    fontSize: 13.5,
  },
  text: {
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
});

export default ModalPicker;
