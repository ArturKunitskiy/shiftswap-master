import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInputProps,
} from 'react-native';
import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito-sans';
import {
  AppText as Text,
  AppTextInput as TextInput,
} from './Typography';

// Dashboard.tsx remains available but is intentionally not mounted in auth-only mode.
type Role = 'employee' | 'manager';

interface RegisteredUser {
  fullName: string;
  email: string;
  role: Role;
  passwordSalt: string;
  passwordHash: string;
  // Employee fields
  specialty?: string;
  branchCode?: string;
  // Manager fields (branch configuration)
  branchName?: string;
  branchAddress?: string;
  branchHours?: string;
  createdAt: string;
}

// Pure SHA-256 implementation for salted password hashing
function sha256(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

function generateSalt(): string {
  return Math.random().toString(36).substring(2, 10);
}

function hashPasswordWithSalt(password: string, salt: string): string {
  const utf8Password = unescape(encodeURIComponent(`${salt}:${password}`));
  return `sha256$${salt}$${sha256(utf8Password)}`;
}

const SPECIALTIES = ['Бариста', 'Официант', 'Курьер', 'Кассир', 'Повар'];
const STEP_TITLES = ['Профиль', 'Работа', 'Пароль'];

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA49E"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(
    null
  );
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success'>(
    'idle'
  );
  const [successAction, setSuccessAction] = useState<'login' | 'register'>(
    'register'
  );
  const [successMessage, setSuccessMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [specialty, setSpecialty] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchHours, setBranchHours] = useState('');
  const [error, setError] = useState('');

  const showAuthSuccess = (
    message: string,
    action: 'login' | 'register'
  ) => {
    setSuccessMessage(message);
    setSuccessAction(action);
    setAuthStatus('loading');
    setError('');
    setTimeout(() => setAuthStatus('success'), 850);
  };

  const validateStep = (): string => {
    if (step === 0) {
      if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
        return 'Введите имя и фамилию.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Проверьте адрес электронной почты.';
      }
    }

    if (step === 1 && role === 'employee') {
      if (!specialty) return 'Выберите вашу специальность.';
      if (branchCode.trim().length < 3) return 'Введите код филиала (от 3 символов).';
    }

    if (step === 1 && role === 'manager') {
      if (branchName.trim().length < 3) return 'Введите название филиала.';
      if (branchAddress.trim().length < 5) return 'Введите адрес филиала.';
      if (branchHours.trim().length < 5) return 'Укажите часы работы.';
    }

    if (step === 2) {
      if (password.length < 8) return 'Пароль должен содержать не менее 8 символов.';
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Добавьте в пароль хотя бы одну букву и одну цифру.';
      }
      if (password !== confirmPassword) return 'Пароли не совпадают.';
    }

    return '';
  };

  const handleContinue = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPasswordWithSalt(password, salt);
    const common = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordSalt: salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    if (role === 'employee') {
      setRegisteredUser({
        ...common,
        role,
        specialty,
        branchCode: branchCode.trim().toUpperCase(),
      });
    } else {
      setRegisteredUser({
        ...common,
        role,
        branchName: branchName.trim(),
        branchAddress: branchAddress.trim(),
        branchHours: branchHours.trim(),
      });
    }
    setLoginEmail(email.trim().toLowerCase());
    setLoginPassword('');
    showAuthSuccess(
      'Регистрация прошла успешно. Аккаунт создан.',
      'register'
    );
  };

  const handleLogin = () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setError('Проверьте адрес электронной почты.');
      return;
    }

    if (!registeredUser) {
      setError('В этой сессии аккаунт не найден. Сначала зарегистрируйтесь.');
      return;
    }

    const passwordHash = hashPasswordWithSalt(
      loginPassword,
      registeredUser.passwordSalt
    );
    if (
      registeredUser.email !== loginEmail.trim().toLowerCase() ||
      registeredUser.passwordHash !== passwordHash
    ) {
      setError('Неверная почта или пароль.');
      return;
    }

    setLoginPassword('');
    showAuthSuccess('Вы успешно вошли в аккаунт.', 'login');
  };

  const handleSuccessDone = () => {
    setAuthStatus('idle');
    setAuthMode('login');
    setStep(0);
    setPassword('');
    setConfirmPassword('');
    setLoginPassword('');
    setError('');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <Text style={styles.brandName}>shiftswap</Text>
      </View>
    );
  }

  if (authStatus !== 'idle') {
    const isLoading = authStatus === 'loading';
    return (
      <View style={styles.screen}>
        <View style={styles.authStatusContainer}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>S</Text>
            </View>
            <Text style={styles.brandName}>shiftswap</Text>
          </View>
          <View style={styles.card}>
            {isLoading ? (
              <View style={styles.statusIcon}>
                <ActivityIndicator size="large" color="#83B82F" />
              </View>
            ) : (
              <View style={[styles.successMark, styles.statusIcon]}>
                <Text style={styles.successMarkText}>✓</Text>
              </View>
            )}
            <Text style={styles.title}>
              {isLoading ? 'Проверяем данные' : 'Всё готово!'}
            </Text>
            <Text style={styles.subtitle}>
              {isLoading
                ? 'Пожалуйста, подождите немного.'
                : successMessage}
            </Text>
            {!isLoading && (
              <Pressable
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={handleSuccessDone}
              >
                <Text style={styles.primaryButtonText}>
                  {successAction === 'register' ? 'Перейти ко входу' : 'Готово'}
                </Text>
                <Text style={styles.buttonArrow}>→</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>S</Text>
          </View>
          <Text style={styles.brandName}>shiftswap</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.authModeRow}>
            {(['login', 'register'] as const).map((mode) => (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityState={{ selected: authMode === mode }}
                style={[
                  styles.authModeButton,
                  authMode === mode && styles.authModeButtonActive,
                ]}
                onPress={() => {
                  setAuthMode(mode);
                  setStep(0);
                  setError('');
                  if (mode === 'login') {
                    setLoginEmail(registeredUser?.email ?? email);
                  }
                }}
              >
                <Text
                  style={[
                    styles.authModeText,
                    authMode === mode && styles.authModeTextActive,
                  ]}
                >
                  {mode === 'login' ? 'Вход' : 'Регистрация'}
                </Text>
              </Pressable>
            ))}
          </View>

          {authMode === 'login' ? (
            <>
              <Text style={styles.title}>С возвращением</Text>
              <Text style={styles.subtitle}>
                Войдите в свой аккаунт ShiftSwap.
              </Text>
              <Field
                label="Электронная почта"
                placeholder="name@example.com"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Пароль"
                placeholder="Введите пароль"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  onPress={handleLogin}
                >
                  <Text style={styles.primaryButtonText}>Войти</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
            <View style={styles.progressHeader}>
              <Text style={styles.eyebrow}>СОЗДАНИЕ АККАУНТА</Text>
              <Text style={styles.stepCount}>0{step + 1} / 03</Text>
            </View>

            <View style={styles.progressTrack}>
              {STEP_TITLES.map((title, index) => (
                <View
                  key={title}
                  style={[
                    styles.progressSegment,
                    index <= step && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.title}>
              {step === 0
                ? 'Начнём знакомство'
                : step === 1
                  ? 'Расскажите о работе'
                  : 'Создайте пароль'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 0
                ? 'Заполните профиль — это займёт всего пару минут.'
                : step === 1
                  ? 'Укажем вашу роль и место работы в ShiftSwap.'
                  : 'Придумайте надёжный пароль для своего аккаунта.'}
            </Text>

            <View style={styles.stepLabelRow}>
              {STEP_TITLES.map((title, index) => (
                <Text
                  key={title}
                  style={[
                    styles.stepLabel,
                    index === step && styles.stepLabelActive,
                  ]}
                >
                  {title}
                </Text>
              ))}
            </View>

            {step === 0 && (
              <>
                <Text style={styles.fieldLabel}>Я присоединяюсь как</Text>
                <View style={styles.roleRow}>
                  {([
                    ['employee', 'Сотрудник'],
                    ['manager', 'Руководитель'],
                  ] as const).map(([value, label]) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: role === value }}
                      style={[
                        styles.roleOption,
                        role === value && styles.roleOptionSelected,
                      ]}
                      onPress={() => {
                        setRole(value);
                        setError('');
                      }}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          role === value && styles.roleOptionTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Field
                  label="Полное имя"
                  placeholder="Например, Анна Иванова"
                  value={fullName}
                  onChangeText={setFullName}
                />
                <Field
                  label="Электронная почта"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            )}

            {step === 1 &&
              (role === 'employee' ? (
                <>
                  <Text style={styles.fieldLabel}>Ваша специальность</Text>
                  <View style={styles.specialtyGrid}>
                    {SPECIALTIES.map((item) => (
                      <Pressable
                        key={item}
                        accessibilityRole="button"
                        accessibilityState={{ selected: specialty === item }}
                        style={[
                          styles.specialtyOption,
                          specialty === item && styles.specialtyOptionSelected,
                        ]}
                        onPress={() => {
                          setSpecialty(item);
                          setError('');
                        }}
                      >
                        <Text
                          style={[
                            styles.specialtyText,
                            specialty === item && styles.specialtyTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Field
                    label="Код филиала"
                    placeholder="Например, MOS01"
                    value={branchCode}
                    onChangeText={setBranchCode}
                    autoCapitalize="characters"
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Название филиала"
                    placeholder="Например, Центр"
                    value={branchName}
                    onChangeText={setBranchName}
                  />
                  <Field
                    label="Адрес филиала"
                    placeholder="Город, улица, дом"
                    value={branchAddress}
                    onChangeText={setBranchAddress}
                  />
                  <Field
                    label="Часы работы"
                    placeholder="Например, ежедневно 09:00–21:00"
                    value={branchHours}
                    onChangeText={setBranchHours}
                  />
                </>
              ))}

            {step === 2 && (
              <>
                <Field
                  label="Пароль"
                  placeholder="Не менее 8 символов"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Field
                  label="Повторите пароль"
                  placeholder="Введите пароль ещё раз"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.passwordHint}>
                  <Text style={styles.hintIcon}>i</Text>
                  <Text style={styles.hintText}>
                    Используйте не менее 8 символов, включая буквы и цифры.
                  </Text>
                </View>
              </>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              {step > 0 && (
                <Pressable
                  accessibilityRole="button"
                  style={styles.backButton}
                  onPress={() => {
                    setStep(step - 1);
                    setError('');
                  }}
                >
                  <Text style={styles.backButtonText}>Назад</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.primaryButton,
                  step > 0 && styles.primaryButtonWithBack,
                ]}
                onPress={handleContinue}
              >
                <Text style={styles.primaryButtonText}>
                  {step === 2 ? 'Создать аккаунт' : 'Продолжить'}
                </Text>
                <Text style={styles.buttonArrow}>
                  {step === 2 ? '✓' : '→'}
                </Text>
              </Pressable>
            </View>
            </>
          )}
        </View>
        <Text style={styles.bottomNote}>
          {authMode === 'login'
            ? 'ДЕМО: вход доступен в этой сессии после регистрации.'
            : 'ПЛАНИРУЙТЕ СМЕНЫ. РАБОТАЙТЕ ВМЕСТЕ.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fontLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F2EF',
  },
  authStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F1F2EF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#B9EC45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brandMarkText: {
    color: '#20251D',
    fontSize: 20,
    fontWeight: '700',
  },
  brandName: {
    color: '#20251D',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 26,
    borderWidth: 1,
    borderColor: '#ECEEEA',
    shadowColor: '#272D22',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  authModeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F2EF',
    borderRadius: 13,
    padding: 4,
    marginBottom: 23,
  },
  authModeButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#20251D',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  authModeText: {
    color: '#899087',
    fontSize: 13,
    fontWeight: '600',
  },
  authModeTextActive: {
    color: '#30392A',
    fontWeight: '800',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#77877D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  stepCount: {
    color: '#76867B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    marginBottom: 26,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#E9EDE9',
  },
  progressSegmentActive: {
    backgroundColor: '#B9EC45',
  },
  title: {
    color: '#20251D',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#7B8981',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 22,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0ED',
    marginBottom: 22,
  },
  stepLabel: {
    color: '#A0AAA3',
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 11,
  },
  stepLabelActive: {
    color: '#5E812A',
    borderBottomWidth: 2,
    borderBottomColor: '#B9EC45',
  },
  field: {
    marginTop: 17,
  },
  fieldLabel: {
    color: '#40564A',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E3E9E4',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#20392E',
    backgroundColor: '#FCFDFC',
    fontSize: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 9,
    marginBottom: 2,
  },
  roleOption: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E9E4',
    borderRadius: 12,
    backgroundColor: '#FCFDFC',
  },
  roleOptionSelected: {
    borderColor: '#A8D83B',
    backgroundColor: '#F0F7E5',
  },
  roleOptionText: {
    color: '#77847B',
    fontSize: 13,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#4E6F24',
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  specialtyOption: {
    borderWidth: 1,
    borderColor: '#E3E9E4',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FCFDFC',
  },
  specialtyOptionSelected: {
    borderColor: '#A8D83B',
    backgroundColor: '#F0F7E5',
  },
  specialtyText: {
    color: '#77847B',
    fontSize: 12,
    fontWeight: '600',
  },
  specialtyTextSelected: {
    color: '#4E6F24',
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  hintIcon: {
    width: 17,
    height: 17,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#557461',
    borderColor: '#B9C9BD',
    borderWidth: 1,
    borderRadius: 9,
    fontSize: 11,
    fontWeight: '600',
  },
  hintText: {
    flex: 1,
    color: '#849087',
    fontSize: 11,
    lineHeight: 17,
  },
  errorBox: {
    backgroundColor: '#FFF3F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  errorText: {
    color: '#A74434',
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 10,
  },
  primaryButton: {
    minHeight: 52,
    flex: 1,
    borderRadius: 13,
    backgroundColor: '#B9EC45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonWithBack: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#29341D',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonArrow: {
    color: '#29341D',
    fontSize: 18,
    marginLeft: 9,
  },
  backButton: {
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E9E4',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#617067',
    fontSize: 13,
    fontWeight: '600',
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: '#EDF0ED',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0ED',
    paddingVertical: 18,
    marginTop: 22,
    marginBottom: 20,
  },
  summaryLabel: {
    color: '#89958C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 10,
  },
  summaryValue: {
    color: '#294236',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  successMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EC',
    marginBottom: 22,
  },
  successMarkText: {
    color: '#5D8B27',
    fontSize: 25,
    fontWeight: '600',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF7DE',
    marginBottom: 20,
  },
  bottomNote: {
    color: '#A5AEA7',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.8,
    textAlign: 'center',
    marginTop: 22,
  },
});
