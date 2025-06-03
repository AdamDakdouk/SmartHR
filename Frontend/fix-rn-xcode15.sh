#!/bin/bash
# Fix for Xcode 15 and React Native
cd node_modules/react-native
if [ -f "third-party/folly-2018.10.22.00/folly/container/detail/F14Table.h" ]; then
  echo "Patching F14Table.h..."
  sed -i '' 's/kIsLittle_ == bool{__BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__}/kIsLittle_/g' "third-party/folly-2018.10.22.00/folly/container/detail/F14Table.h"
fi

if [ -f "third-party/folly-2021/folly/container/detail/F14Table.h" ]; then
  echo "Patching newer F14Table.h..."
  sed -i '' 's/kIsLittle_ == bool{__BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__}/kIsLittle_/g' "third-party/folly-2021/folly/container/detail/F14Table.h"
fi

if [ -f "ReactCommon/cxxreact/JSBigString.h" ]; then
  echo "Patching JSBigString.h..."
  sed -i '' 's/std::basic_string<unsigned char>/std::basic_string<char>/g' "ReactCommon/cxxreact/JSBigString.h"
fi

if [ -f "React/Base/RCTModuleMethod.mm" ]; then
  echo "Patching RCTModuleMethod.mm..."
  sed -i '' 's/RCTReadString(dictionary, key, nil)/RCTReadString(dictionary, key, @"")/g' "React/Base/RCTModuleMethod.mm"
fi