import React from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

const fontFamilies: Record<string, string> = {
  '400': 'NunitoSans_400Regular',
  '500': 'NunitoSans_500Medium',
  '600': 'NunitoSans_600SemiBold',
  '700': 'NunitoSans_700Bold',
  '800': 'NunitoSans_800ExtraBold',
  '900': 'NunitoSans_900Black',
  normal: 'NunitoSans_400Regular',
  bold: 'NunitoSans_700Bold',
};

function fontFamilyFor(style: TextProps['style'] | TextInputProps['style']) {
  const weight = String(StyleSheet.flatten(style)?.fontWeight ?? '400');
  return fontFamilies[weight] ?? fontFamilies['400'];
}

export function AppText({ style, ...props }: TextProps) {
  return (
    <NativeText
      {...props}
      style={[style, { fontFamily: fontFamilyFor(style) }]}
    />
  );
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return (
    <NativeTextInput
      {...props}
      style={[style, { fontFamily: fontFamilyFor(style) }]}
    />
  );
}
