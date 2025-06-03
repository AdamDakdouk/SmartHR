import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react-native";
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getHours,
  setHours,
  isSameMonth,
  isToday,
  addDays,
  subDays,
  startOfDay,
} from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getTasksForEmployee } from "@/api/Tasks";

const { width } = Dimensions.get("window");
// Calculate day width to fit exactly 5 days on screen
const VISIBLE_DAYS = 5;
const CONTAINER_PADDING = 32; // Account for container padding
const DAY_MARGIN = 8; // Small margin between days
const DAY_WIDTH =
  (width - CONTAINER_PADDING - DAY_MARGIN * (VISIBLE_DAYS - 1)) / VISIBLE_DAYS;

// Types
interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: string;
  createdBy: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  completedAt?: string;
  isAllDay?: boolean;
}

interface TaskCardProps {
  task: Task;
  colors: any;
  onPress?: (task: Task) => void;
}

interface TimelineRowProps {
  hour: number;
  date: Date;
  tasks: Task[];
  colors: any;
  onTaskPress: (task: Task) => void;
}

interface DayGroupProps {
  days: Date[];
  selectedDate: Date;
  currentViewDate: Date;
  colors: any;
  onDateSelect: (date: Date) => void;
}

// Task Card Component
const TaskCard: React.FC<TaskCardProps> = ({ task, colors, onPress }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#FF4B4B";
      case "medium":
        return "#FFA64B";
      case "low":
        return "#4BB4FF";
      default:
        return colors.tint;
    }
  };

  const getStatusOpacity = (status: string) => {
    return status === "completed" ? 0.7 : status === "in_progress" ? 0.9 : 1;
  };

  const handlePress = () => {
    if (onPress) {
      onPress(task);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.taskCard,
        {
          backgroundColor: getPriorityColor(task.priority),
          opacity: getStatusOpacity(task.status),
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: "#FFF" }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Text
          style={[styles.taskDescription, { color: "rgba(255,255,255,0.8)" }]}
          numberOfLines={2}
        >
          {task.description}
        </Text>
        <View style={styles.taskTime}>
          <Text
            style={[styles.taskTimeText, { color: "rgba(255,255,255,0.9)" }]}
          >
            {format(new Date(task.dueDate), "h:mm a")}
          </Text>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  task.status === "completed"
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(255,255,255,0.2)",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {task.status.replace("_", " ")}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Day Group Component (Renders a group of 5 days)
const DayGroup: React.FC<DayGroupProps> = ({
  days,
  selectedDate,
  currentViewDate,
  colors,
  onDateSelect,
}) => {
  return (
    <View style={styles.dayGroupContainer}>
      {days.map((date) => (
        <TouchableOpacity
          key={date.toISOString()}
          style={[
            styles.dayContainer,
            isSameDay(date, selectedDate) && {
              backgroundColor: colors.tint,
              elevation: 3,
              shadowColor: colors.tint,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
            !isSameMonth(date, currentViewDate) && styles.differentMonth,
          ]}
          onPress={() => onDateSelect(date)}
        >
          <Text
            style={[
              styles.dayName,
              {
                color: isSameDay(date, selectedDate)
                  ? "rgba(255,255,255,0.8)"
                  : !isSameMonth(date, currentViewDate)
                  ? colors.icon
                  : colors.text,
              },
            ]}
          >
            {format(date, "EEE")}
          </Text>
          <Text
            style={[
              styles.dayNumber,
              {
                color: isSameDay(date, selectedDate)
                  ? "#FFF"
                  : !isSameMonth(date, currentViewDate)
                  ? colors.icon
                  : colors.text,
                fontWeight: isToday(date) ? "700" : "600",
              },
            ]}
          >
            {format(date, "d")}
          </Text>
          {isToday(date) && (
            <View
              style={[
                styles.todayIndicator,
                {
                  backgroundColor: isSameDay(date, selectedDate)
                    ? "#FFF"
                    : colors.tint,
                },
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// All-Day Tasks Component
const AllDayTasks: React.FC<{
  tasks: Task[];
  colors: any;
  onTaskPress: (task: Task) => void;
}> = ({ tasks, colors, onTaskPress }) => {
  if (tasks.length === 0) return null;

  return (
    <View style={styles.allDayContainer}>
      <Text style={[styles.allDayLabel, { color: colors.text }]}>All-day</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.allDayTasksContainer}
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TaskCard task={item} colors={colors} onPress={onTaskPress} />
        )}
      />
    </View>
  );
};

// Timeline Row Component
const TimelineRow: React.FC<TimelineRowProps> = ({
  hour,
  date,
  tasks,
  colors,
  onTaskPress,
}) => {
  const hourStart = setHours(date, hour);
  const tasksInHour = tasks.filter((task) => {
    if (task.isAllDay) return false;
    const taskDate = new Date(task.dueDate);
    return getHours(taskDate) === hour && isSameDay(taskDate, date);
  });

  return (
    <View style={styles.timeSlot}>
      <Text style={[styles.timeLabel, { color: colors.icon }]}>
        {format(hourStart, "h a")}
      </Text>
      <View
        style={[
          styles.eventContainer,
          { borderBottomColor: `${colors.text}15` },
        ]}
      >
        {tasksInHour.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            colors={colors}
            onPress={onTaskPress}
          />
        ))}
      </View>
    </View>
  );
};

// Empty State Component
const EmptyState: React.FC<{ colors: any }> = ({ colors }) => (
  <View style={styles.emptyState}>
    <Calendar size={60} color={`${colors.text}50`} />
    <Text style={[styles.emptyStateText, { color: colors.text }]}>
      No tasks scheduled for this day
    </Text>
    <Text style={[styles.emptyStateSubtext, { color: `${colors.text}80` }]}>
      Your schedule is clear
    </Text>
  </View>
);

// Main Calendar Screen Component
const CalendarScreen: React.FC = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const timelineRef = useRef<FlatList>(null);
  const { user } = useAuth();

  // Fetch tasks for the user
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => getTasksForEmployee(user?.id),
    enabled: !!user?.id,
    select: (data) =>
      data.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate).toISOString(),
        isAllDay: task.isAllDay || false, // Handle all-day tasks
      })),
  });

  // Generate hours for the timeline
  const timelineHours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    []
  );

  // Generate all days to be shown, grouped in sets of 5
  const allDaysGrouped = useMemo(() => {
    // Start from 60 days before today and go to 60 days after
    const startDate = subDays(new Date(), 60);
    const endDate = addDays(new Date(), 60);

    // Get all dates in the range
    const allDays = eachDayOfInterval({
      start: startOfDay(startDate),
      end: startOfDay(endDate),
    });

    // Group the days into chunks of 5
    const groups = [];
    for (let i = 0; i < allDays.length; i += VISIBLE_DAYS) {
      const group = allDays.slice(i, i + VISIBLE_DAYS);
      if (group.length === VISIBLE_DAYS) {
        // Only add complete groups
        groups.push(group);
      }
    }

    return groups;
  }, []);

  // Find the initial index to scroll to (the group containing today)
  const initialScrollIndex = useMemo(() => {
    const today = startOfDay(new Date());

    // Try to find a group with today as the first day
    let groupIndex = allDaysGrouped.findIndex(
      (group) => group[0] && isSameDay(group[0], today)
    );

    // If not found as first day, find any group containing today
    if (groupIndex === -1) {
      groupIndex = allDaysGrouped.findIndex((group) =>
        group.some((date) => isSameDay(date, today))
      );
    }

    return Math.max(0, groupIndex);
  }, [allDaysGrouped]);

  // Handle date selection
  const handleDateSelection = useCallback(
    (date: Date) => {
      setSelectedDate(date);

      // Update current view month if selected date is from a different month
      if (!isSameMonth(date, currentViewDate)) {
        setCurrentViewDate(date);
      }
    },
    [currentViewDate]
  );

  // Filter tasks for the selected date
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: { dueDate: string; isAllDay?: boolean }) =>
      isSameDay(parseISO(task.dueDate), selectedDate)
    );
  }, [tasks, selectedDate]);

  // Separate all-day tasks and timed tasks
  const allDayTasks = useMemo(
    () => filteredTasks.filter((task: { isAllDay: any }) => task.isAllDay),
    [filteredTasks]
  );

  const timedTasks = useMemo(
    () => filteredTasks.filter((task: { isAllDay: any }) => !task.isAllDay),
    [filteredTasks]
  );

  // Handle task press
  const handleTaskPress = useCallback((task: Task) => {
    // You can implement task detail navigation or modal here
    console.log("Task pressed:", task);
    // Example: navigation.navigate('TaskDetail', { taskId: task._id });
  }, []);

  // Scroll to a date by making it the first date of the visible group
  const scrollToDateAsFirstDay = useCallback(
    (targetDate: Date) => {
      if (flatListRef.current) {
        // Find the group where the target date is the first date or any position
        const dateToFind = startOfDay(targetDate);

        // First try to find a group that has this date as the first item
        let groupIndex = allDaysGrouped.findIndex(
          (group) => group[0] && isSameDay(group[0], dateToFind)
        );

        // If not found as first item, find any group containing this date
        if (groupIndex === -1) {
          for (let i = 0; i < allDaysGrouped.length; i++) {
            const foundIndex = allDaysGrouped[i].findIndex((date) =>
              isSameDay(date, dateToFind)
            );

            if (foundIndex !== -1) {
              groupIndex = i;
              break;
            }
          }
        }

        if (groupIndex !== -1) {
          flatListRef.current.scrollToIndex({
            index: groupIndex,
            animated: true,
            viewPosition: 0.5,
          });

          // Also select this date
          handleDateSelection(targetDate);
        }
      }

      // Also scroll timeline to 8 AM by default
      if (timelineRef.current) {
        timelineRef.current.scrollToOffset({
          offset: 8 * 80, // 80 is the approximate height of each time slot
          animated: true,
        });
      }
    },
    [allDaysGrouped, handleDateSelection]
  );

  // Handle scroll to today
  const scrollToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentViewDate(today);
    scrollToDateAsFirstDay(today);
  }, [scrollToDateAsFirstDay]);

  // Handle month navigation
  const navigateMonth = useCallback(
    (direction: "prev" | "next") => {
      const newDate =
        direction === "prev"
          ? subMonths(currentViewDate, 1)
          : addMonths(currentViewDate, 1);

      setCurrentViewDate(newDate);
      scrollToDateAsFirstDay(startOfMonth(newDate));
    },
    [currentViewDate, scrollToDateAsFirstDay]
  );

  // Handle errors when FlatList attempts to scroll to an index that doesn't exist
  const handleScrollToIndexFailed = useCallback(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({
            offset: 0,
            animated: false,
          });

          // Try again with index 0
          setTimeout(() => {
            if (flatListRef.current && initialScrollIndex > 0) {
              flatListRef.current.scrollToIndex({
                index: 0,
                animated: false,
              });
            }
          }, 100);
        }
      }, 100);
    }
  }, [initialScrollIndex]);

  // Handle view update when scrolling ends
  const handleMomentumScrollEnd = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { x: any };
        layoutMeasurement: { width: any };
      };
    }) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const width = event.nativeEvent.layoutMeasurement.width;

      // Calculate which page we're on
      const pageIndex = Math.floor(offsetX / width);

      if (pageIndex >= 0 && pageIndex < allDaysGrouped.length) {
        const firstDateInGroup = allDaysGrouped[pageIndex][0];

        // Update current view month if we've scrolled to a new month
        if (!isSameMonth(firstDateInGroup, currentViewDate)) {
          setCurrentViewDate(firstDateInGroup);
        }
      }
    },
    [allDaysGrouped, currentViewDate]
  );

  // Initial scroll to today - only on first mount and focus
  useEffect(() => {
    if (!hasInitiallyScrolled && initialScrollIndex !== -1) {
      const timer = setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: initialScrollIndex,
            animated: false,
          });
          setHasInitiallyScrolled(true);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    // Note the empty dependency array - this will only run once on mount
  }, []);

  // Reset on focus to ensure the calendar updates if the component is re-mounted or focused
  useFocusEffect(
    useCallback(() => {
      // Only run this on first focus
      if (!hasInitiallyScrolled) {
        scrollToToday();
        setHasInitiallyScrolled(true);
      }

      return () => {
        // No cleanup needed
      };
    }, [scrollToToday])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Month navigation header */}
      <View style={styles.monthContainer}>
        <TouchableOpacity
          onPress={() => navigateMonth("prev")}
          style={styles.monthNav}
        >
          <ChevronLeft size={20} color={colors.icon} />
          <Text style={[styles.monthNavText, { color: colors.icon }]}>
            {format(subMonths(currentViewDate, 1), "MMM")}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.monthText, { color: colors.text }]}>
          {format(currentViewDate, "MMMM yyyy")}
        </Text>

        <TouchableOpacity
          onPress={() => navigateMonth("next")}
          style={styles.monthNav}
        >
          <Text style={[styles.monthNavText, { color: colors.icon }]}>
            {format(addMonths(currentViewDate, 1), "MMM")}
          </Text>
          <ChevronRight size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Date picker Netflix-style horizontal scroll */}
      <View style={styles.weekContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={true}
          snapToInterval={width - 32} // Full width minus container padding
          decelerationRate="fast"
          onScrollToIndexFailed={handleScrollToIndexFailed}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          contentContainerStyle={styles.daysScrollContent}
          data={allDaysGrouped}
          keyExtractor={(item) => item[0].toISOString()}
          getItemLayout={(data, index) => ({
            length: width - 32,
            offset: (width - 32) * index,
            index,
          })}
          renderItem={({ item }) => (
            <DayGroup
              days={item}
              selectedDate={selectedDate}
              currentViewDate={currentViewDate}
              colors={colors}
              onDateSelect={handleDateSelection}
            />
          )}
        />
      </View>

      {/* Schedule header with today button */}
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Schedule
        </Text>
        <TouchableOpacity
          style={[styles.todayButton, { backgroundColor: colors.tint + "20" }]}
          onPress={scrollToToday}
        >
          <Text style={[styles.todayButtonText, { color: colors.tint }]}>
            Today
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <>
          {/* All-day tasks */}
          <AllDayTasks
            tasks={allDayTasks}
            colors={colors}
            onTaskPress={handleTaskPress}
          />

          {/* Hourly timeline */}
          {timedTasks.length > 0 ? (
            <FlatList
              ref={timelineRef}
              style={styles.timelineContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              data={timelineHours}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item: hour }) => (
                <TimelineRow
                  hour={hour}
                  date={selectedDate}
                  tasks={timedTasks}
                  colors={colors}
                  onTaskPress={handleTaskPress}
                />
              )}
            />
          ) : (
            // Empty state when no tasks for the day
            <EmptyState colors={colors} />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  monthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  monthNavText: {
    fontSize: 14,
  },
  monthText: {
    fontSize: 24,
    fontWeight: "700",
  },
  daysScrollContent: {
    paddingVertical: 8,
  },
  differentMonth: {
    opacity: 0.6,
  },
  weekContainer: {
    height: 84,
  },
  dayGroupContainer: {
    flexDirection: "row",
    width: width - 32, // Full width minus container padding
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 24,
    width: DAY_WIDTH,
    height: 70,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 20,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  todayButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  timelineContainer: {
    flex: 1,
  },
  taskCard: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
    maxWidth: width - 100,
    width: width * 0.7,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  taskTime: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskTimeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 11,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  timeSlot: {
    flexDirection: "row",
    minHeight: 80,
    paddingVertical: 8,
  },
  timeLabel: {
    width: 60,
    paddingTop: 8,
    paddingRight: 16,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "500",
  },
  eventContainer: {
    flex: 1,
    position: "relative",
    borderBottomWidth: 1,
  },
  allDayContainer: {
    marginBottom: 16,
  },
  allDayLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  allDayTasksContainer: {
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default CalendarScreen;
