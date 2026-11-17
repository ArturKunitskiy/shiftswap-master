import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from './Typography';

type Role = 'employee' | 'manager';
type Tab = 'home' | 'schedule' | 'swaps' | 'profile';

export type DashboardUser = {
  fullName: string;
  email: string;
  role: Role;
  specialty?: string;
  branchCode?: string;
  branchName?: string;
  branchAddress?: string;
  branchHours?: string;
};

type DashboardProps = {
  user: DashboardUser;
  onSignOut: () => void;
};

type Shift = {
  date: Date;
  start: string;
  end: string;
  title: string;
  person: string;
};

const TAB_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: '⌂' },
  { id: 'schedule', label: 'График', icon: '▦' },
  { id: 'swaps', label: 'Обмены', icon: '⇄' },
  { id: 'profile', label: 'Профиль', icon: '○' },
];

function makeShifts(name: string, isManager: boolean): Shift[] {
  const today = new Date();
  return [
    { offset: 0, start: '12:00', end: '20:00', title: 'Дневная смена' },
    { offset: 1, start: '09:00', end: '17:00', title: 'Утренняя смена' },
    { offset: 3, start: '14:00', end: '22:00', title: 'Вечерняя смена' },
    { offset: 5, start: '10:00', end: '18:00', title: 'Дневная смена' },
  ].map((item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + item.offset);
    return {
      date,
      start: item.start,
      end: item.end,
      title: item.title,
      person: isManager
        ? ['Анна', 'Михаил', 'Ольга', 'Дамир'][index]
        : name,
    };
  });
}

function dayLabel(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
        >
          <AppText style={styles.sectionAction}>{action}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function ShiftCard({ shift }: { shift: Shift }) {
  return (
    <View style={styles.shiftCard}>
      <View style={styles.shiftDate}>
        <AppText style={styles.shiftWeekday}>
          {dayLabel(shift.date, { weekday: 'short' }).replace('.', '')}
        </AppText>
        <AppText style={styles.shiftDayNumber}>
          {dayLabel(shift.date, { day: 'numeric' })}
        </AppText>
      </View>
      <View style={styles.shiftDivider} />
      <View style={styles.shiftDetails}>
        <AppText style={styles.shiftTitle}>{shift.title}</AppText>
        <AppText style={styles.shiftMeta}>{shift.person} · Основной филиал</AppText>
      </View>
      <View style={styles.shiftTime}>
        <AppText style={styles.shiftTimeText}>{shift.start}</AppText>
        <AppText style={styles.shiftTimeDash}>—</AppText>
        <AppText style={styles.shiftTimeText}>{shift.end}</AppText>
      </View>
    </View>
  );
}

export default function Dashboard({ user, onSignOut }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [respondedToSwap, setRespondedToSwap] = useState(false);
  const firstName = user.fullName.trim().split(/\s+/)[0];
  const isManager = user.role === 'manager';
  const shifts = makeShifts(firstName, isManager);
  const nextShift = shifts[0];
  const swapDate = new Date();
  swapDate.setDate(swapDate.getDate() + ((4 - swapDate.getDay() + 7) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });

  const renderHome = () => (
    <>
      <View style={styles.welcomeRow}>
        <View>
          <AppText style={styles.greeting}>Добро пожаловать,</AppText>
          <AppText style={styles.greetingName}>{firstName} 👋</AppText>
        </View>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>
            {firstName.charAt(0).toUpperCase()}
          </AppText>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <AppText style={styles.heroEyebrow}>
            {isManager ? 'ВАША КОМАНДА' : 'ВАША НЕДЕЛЯ'}
          </AppText>
          <AppText style={styles.heroTitle}>
            {isManager ? 'Смены под контролем' : 'Всё по графику'}
          </AppText>
          <AppText style={styles.heroSubtitle}>
            {isManager
              ? 'Посмотрите расписание и заявки команды'
              : '4 смены запланировано на этой неделе'}
          </AppText>
        </View>
        <View style={styles.progressCircle}>
          <AppText style={styles.progressValue}>
            {isManager ? '4' : '4'}
          </AppText>
          <AppText style={styles.progressCaption}>
            {isManager ? 'смены' : 'смены'}
          </AppText>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <AppText style={styles.metricIconText}>◷</AppText>
          </View>
          <AppText style={styles.metricLabel}>
            {isManager ? 'Сотрудников' : 'Ближайшая смена'}
          </AppText>
          <AppText style={styles.metricValue}>
            {isManager ? '12' : `${nextShift.start}–${nextShift.end}`}
          </AppText>
          <AppText style={styles.metricCaption}>
            {isManager ? 'в команде' : 'сегодня'}
          </AppText>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, styles.swapMetricIcon]}>
            <AppText style={styles.swapMetricIconText}>⇄</AppText>
          </View>
          <AppText style={styles.metricLabel}>
            {isManager ? 'Заявки на обмен' : 'Доступно для обмена'}
          </AppText>
          <AppText style={styles.metricValue}>
            {isManager ? '2' : '1 смена'}
          </AppText>
          <AppText style={styles.metricCaption}>
            {isManager ? 'требуют внимания' : 'от команды'}
          </AppText>
        </View>
      </View>

      <View style={styles.whiteCard}>
        <SectionTitle
          title={dayLabel(new Date(), { month: 'long', year: 'numeric' })}
          action="Весь график"
          onAction={() => setActiveTab('schedule')}
        />
        <View style={styles.weekRow}>
          {weekDays.map((date) => {
            const day = date.getDate();
            const selected = day === selectedDay;
            return (
              <Pressable
                key={date.toISOString()}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedDay(day)}
                style={[styles.weekDay, selected && styles.weekDaySelected]}
              >
                <AppText
                  style={[styles.weekdayName, selected && styles.weekdaySelectedText]}
                >
                  {dayLabel(date, { weekday: 'short' }).replace('.', '')}
                </AppText>
                <AppText
                  style={[styles.weekdayNumber, selected && styles.weekdaySelectedText]}
                >
                  {day}
                </AppText>
                {shifts.some(
                  (shift) => shift.date.getDate() === day
                ) && <View style={styles.shiftDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <SectionTitle
        title={isManager ? 'Команда сегодня' : 'Ближайшие смены'}
        action="Все"
        onAction={() => setActiveTab('schedule')}
      />
      {shifts.slice(0, 2).map((shift) => (
        <ShiftCard key={shift.date.toISOString()} shift={shift} />
      ))}
      <AppText style={styles.demoNote}>
        Это пример интерфейса. Расписание пока не подключено к серверу.
      </AppText>
    </>
  );

  const renderSchedule = () => (
    <>
      <AppText style={styles.pageEyebrow}>ВАШЕ ВРЕМЯ</AppText>
      <AppText style={styles.pageTitle}>Расписание</AppText>
      <AppText style={styles.pageSubtitle}>
        {isManager
          ? 'Планируйте смены вашей команды.'
          : 'Все рабочие смены в одном месте.'}
      </AppText>
      <View style={styles.weekSelector}>
        {weekDays.map((date) => {
          const day = date.getDate();
          const selected = day === selectedDay;
          return (
            <Pressable
              key={date.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedDay(day)}
              style={[styles.selectorDay, selected && styles.selectorDaySelected]}
            >
              <AppText
                style={[styles.selectorWeekday, selected && styles.selectorTextSelected]}
              >
                {dayLabel(date, { weekday: 'short' }).replace('.', '')}
              </AppText>
              <AppText
                style={[styles.selectorNumber, selected && styles.selectorTextSelected]}
              >
                {day}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <SectionTitle title="Запланированные смены" />
      {shifts.map((shift) => (
        <ShiftCard key={shift.date.toISOString()} shift={shift} />
      ))}
      <AppText style={styles.demoNote}>
        Демонстрационные данные — подключите расписание команды, чтобы увидеть реальные смены.
      </AppText>
    </>
  );

  const renderSwaps = () => (
    <>
      <AppText style={styles.pageEyebrow}>ГИБКИЙ ГРАФИК</AppText>
      <AppText style={styles.pageTitle}>Обмен сменами</AppText>
      <AppText style={styles.pageSubtitle}>
        {isManager
          ? 'Заявки команды появятся здесь.'
          : 'Найдите удобную замену или предложите свою смену.'}
      </AppText>
      <View style={styles.swapBanner}>
        <View style={styles.swapBannerIcon}>
          <AppText style={styles.swapBannerIconText}>⇄</AppText>
        </View>
        <View style={styles.swapBannerCopy}>
          <AppText style={styles.swapBannerTitle}>
            {isManager ? 'Заявки команды' : 'Обмен — это просто'}
          </AppText>
          <AppText style={styles.swapBannerText}>
            {isManager
              ? 'Проверьте доступные запросы сотрудников.'
              : 'Договоритесь с коллегой и отправьте запрос руководителю.'}
          </AppText>
        </View>
      </View>
      <SectionTitle title={isManager ? 'На рассмотрении' : 'Предложения команды'} />
      <View style={styles.swapCard}>
        <View style={styles.swapCardHeader}>
          <View style={styles.smallAvatar}>
            <AppText style={styles.smallAvatarText}>
              {isManager ? 'АК' : 'МЛ'}
            </AppText>
          </View>
          <View style={styles.swapPerson}>
            <AppText style={styles.swapPersonName}>
              {isManager ? 'Анна Кузнецова' : 'Мария ищет обмен'}
            </AppText>
            <AppText style={styles.swapPersonRole}>
              {isManager ? 'Просит поменять смену' : 'Бариста · ваш филиал'}
            </AppText>
          </View>
          <View style={styles.openBadge}>
            <AppText style={styles.openBadgeText}>
              {respondedToSwap ? 'ОТКЛИК' : 'ОТКРЫТО'}
            </AppText>
          </View>
        </View>
        <View style={styles.swapShiftBox}>
          <AppText style={styles.swapDateLabel}>
            {dayLabel(swapDate, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).toUpperCase()}
          </AppText>
          <AppText style={styles.swapDateValue}>14:00 — 22:00</AppText>
          <AppText style={styles.swapShiftDetails}>
            Вечерняя смена · Основной филиал
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          style={[
            styles.swapButton,
            respondedToSwap && styles.swapButtonDone,
          ]}
          onPress={() => setRespondedToSwap(!respondedToSwap)}
        >
          <AppText
            style={[
              styles.swapButtonText,
              respondedToSwap && styles.swapButtonTextDone,
            ]}
          >
            {respondedToSwap
              ? isManager
                ? 'Заявка рассмотрена'
                : 'Вы откликнулись'
              : isManager
                ? 'Рассмотреть заявку'
                : 'Откликнуться'}
          </AppText>
        </Pressable>
      </View>
      <AppText style={styles.demoNote}>
        Заявки пока демонстрационные и не отправляются другим пользователям.
      </AppText>
    </>
  );

  const renderProfile = () => (
    <>
      <AppText style={styles.pageEyebrow}>ВАШ АККАУНТ</AppText>
      <AppText style={styles.pageTitle}>Профиль</AppText>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <AppText style={styles.profileAvatarText}>
            {firstName.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <AppText style={styles.profileName}>{user.fullName}</AppText>
        <AppText style={styles.profileEmail}>{user.email}</AppText>
        <View style={styles.profileDivider} />
        <ProfileRow
          label="Роль"
          value={isManager ? 'Руководитель' : 'Сотрудник'}
        />
        <ProfileRow
          label={isManager ? 'Филиал' : 'Специальность'}
          value={isManager ? user.branchName ?? '—' : user.specialty ?? '—'}
        />
        <ProfileRow
          label={isManager ? 'Адрес' : 'Код филиала'}
          value={
            isManager
              ? user.branchAddress ?? '—'
              : user.branchCode ?? '—'
          }
        />
      </View>
      <View style={styles.demoInfo}>
        <AppText style={styles.demoInfoTitle}>Демо-режим</AppText>
        <AppText style={styles.demoInfoText}>
          Аккаунт и расписание существуют только в этой сессии приложения. Для реального входа и синхронизации нужен сервер.
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.signOutButton}
        onPress={onSignOut}
      >
        <AppText style={styles.signOutText}>Выйти из аккаунта</AppText>
      </Pressable>
    </>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <AppText style={styles.brandMarkText}>S</AppText>
          </View>
          <AppText style={styles.brandName}>shiftswap</AppText>
          <View style={styles.demoTag}>
            <AppText style={styles.demoTagText}>DEMO</AppText>
          </View>
        </View>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'swaps' && renderSwaps()}
        {activeTab === 'profile' && renderProfile()}
      </ScrollView>

      <View style={styles.tabBar}>
        {TAB_ITEMS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab.id)}
            >
              <View style={[styles.tabIcon, selected && styles.tabIconSelected]}>
                <AppText
                  style={[styles.tabIconText, selected && styles.tabIconTextSelected]}
                >
                  {tab.icon}
                </AppText>
              </View>
              <AppText style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <AppText style={styles.profileRowLabel}>{label}</AppText>
      <AppText style={styles.profileRowValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F2EF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#B9EC45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brandMarkText: {
    color: '#20251D',
    fontSize: 20,
    fontWeight: '800',
  },
  brandName: {
    color: '#20251D',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  demoTag: {
    marginLeft: 'auto',
    backgroundColor: '#E4E7DF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demoTagText: {
    color: '#798071',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: {
    color: '#7B8079',
    fontSize: 13,
  },
  greetingName: {
    color: '#20251D',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5F2A0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#3D5522',
    fontSize: 17,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 140,
    backgroundColor: '#D9F5A5',
    borderRadius: 23,
    paddingHorizontal: 20,
    paddingVertical: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 8,
  },
  heroEyebrow: {
    color: '#596A3D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: '#22281B',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: 7,
  },
  heroSubtitle: {
    color: '#5D6A4D',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  progressCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 7,
    borderColor: '#A8D83B',
    backgroundColor: '#E9F9CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    color: '#33441C',
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '800',
  },
  progressCaption: {
    color: '#70804F',
    fontSize: 9,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  metricIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#F2F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  metricIconText: {
    color: '#7A9B41',
    fontSize: 19,
    fontWeight: '700',
  },
  swapMetricIcon: {
    backgroundColor: '#F0F6E5',
  },
  swapMetricIconText: {
    color: '#7DAD31',
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#7B8179',
    fontSize: 10,
  },
  metricValue: {
    color: '#20251D',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: 3,
  },
  metricCaption: {
    color: '#9A9F98',
    fontSize: 9,
    marginTop: 1,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 17,
    marginBottom: 19,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 11,
  },
  sectionTitle: {
    color: '#252921',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  sectionAction: {
    color: '#7DAE30',
    fontSize: 11,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  weekDay: {
    width: 39,
    height: 57,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaySelected: {
    backgroundColor: '#C8F07B',
  },
  weekdayName: {
    color: '#90958D',
    fontSize: 9,
    textTransform: 'capitalize',
  },
  weekdayNumber: {
    color: '#42473F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  weekdaySelectedText: {
    color: '#26331A',
    fontWeight: '800',
  },
  shiftDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#82B832',
  },
  shiftCard: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 9,
  },
  shiftDate: {
    width: 39,
    alignItems: 'center',
  },
  shiftWeekday: {
    color: '#8E948C',
    fontSize: 9,
    textTransform: 'capitalize',
  },
  shiftDayNumber: {
    color: '#282D24',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  shiftDivider: {
    width: 3,
    height: 38,
    borderRadius: 2,
    backgroundColor: '#C7EE78',
    marginHorizontal: 12,
  },
  shiftDetails: {
    flex: 1,
  },
  shiftTitle: {
    color: '#292D26',
    fontSize: 12,
    fontWeight: '800',
  },
  shiftMeta: {
    color: '#91968F',
    fontSize: 9,
    marginTop: 4,
  },
  shiftTime: {
    alignItems: 'flex-end',
    marginLeft: 5,
  },
  shiftTimeText: {
    color: '#30352C',
    fontSize: 10,
    fontWeight: '700',
  },
  shiftTimeDash: {
    color: '#A0A59D',
    fontSize: 8,
    lineHeight: 11,
  },
  demoNote: {
    color: '#999E96',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  pageEyebrow: {
    color: '#899081',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginTop: 8,
  },
  pageTitle: {
    color: '#20251D',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: 4,
  },
  pageSubtitle: {
    color: '#858B82',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 20,
  },
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    paddingHorizontal: 8,
    paddingVertical: 11,
    marginBottom: 20,
  },
  selectorDay: {
    minWidth: 39,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorDaySelected: {
    backgroundColor: '#C8F07B',
  },
  selectorWeekday: {
    color: '#8D938A',
    fontSize: 9,
    textTransform: 'capitalize',
  },
  selectorNumber: {
    color: '#3C4139',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  selectorTextSelected: {
    color: '#26331A',
    fontWeight: '800',
  },
  swapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9F5A5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  swapBannerIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    backgroundColor: '#C2EC70',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  swapBannerIconText: {
    color: '#3D5720',
    fontSize: 25,
    fontWeight: '800',
  },
  swapBannerCopy: {
    flex: 1,
  },
  swapBannerTitle: {
    color: '#303B21',
    fontSize: 13,
    fontWeight: '800',
  },
  swapBannerText: {
    color: '#66764D',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  swapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 16,
    marginBottom: 12,
  },
  swapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF3E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarText: {
    color: '#607147',
    fontSize: 11,
    fontWeight: '800',
  },
  swapPerson: {
    flex: 1,
    marginLeft: 10,
  },
  swapPersonName: {
    color: '#292E25',
    fontSize: 12,
    fontWeight: '800',
  },
  swapPersonRole: {
    color: '#92988F',
    fontSize: 9,
    marginTop: 3,
  },
  openBadge: {
    borderRadius: 10,
    backgroundColor: '#EFF6E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  openBadgeText: {
    color: '#739B35',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  swapShiftBox: {
    backgroundColor: '#F5F6F3',
    borderRadius: 14,
    padding: 13,
    marginTop: 14,
  },
  swapDateLabel: {
    color: '#969B93',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  swapDateValue: {
    color: '#282D24',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },
  swapShiftDetails: {
    color: '#8D938A',
    fontSize: 10,
    marginTop: 3,
  },
  swapButton: {
    height: 45,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B9EC45',
    marginTop: 13,
  },
  swapButtonDone: {
    backgroundColor: '#EEF2E8',
  },
  swapButtonText: {
    color: '#29341D',
    fontSize: 12,
    fontWeight: '800',
  },
  swapButtonTextDone: {
    color: '#65734F',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 23,
    paddingBottom: 8,
    marginTop: 5,
  },
  profileAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#CFF28A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#3B5124',
    fontSize: 25,
    fontWeight: '800',
  },
  profileName: {
    color: '#242920',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  profileEmail: {
    color: '#8B9088',
    fontSize: 11,
    marginTop: 2,
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EEF0EC',
    marginVertical: 15,
  },
  profileRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  profileRowLabel: {
    color: '#888E85',
    fontSize: 11,
  },
  profileRowValue: {
    maxWidth: '60%',
    color: '#33392F',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  demoInfo: {
    backgroundColor: '#E9ECE4',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  demoInfoTitle: {
    color: '#59614F',
    fontSize: 11,
    fontWeight: '800',
  },
  demoInfoText: {
    color: '#7F8678',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  signOutButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE1D8',
    backgroundColor: '#FFFFFF',
    marginTop: 13,
  },
  signOutText: {
    color: '#747B70',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 9,
    shadowColor: '#272D22',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    minWidth: 38,
    height: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconSelected: {
    backgroundColor: '#D8F3A5',
  },
  tabIconText: {
    color: '#899087',
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
  },
  tabIconTextSelected: {
    color: '#415A25',
  },
  tabLabel: {
    color: '#949990',
    fontSize: 9,
    marginTop: 2,
  },
  tabLabelSelected: {
    color: '#4F6A2C',
    fontWeight: '800',
  },
});
