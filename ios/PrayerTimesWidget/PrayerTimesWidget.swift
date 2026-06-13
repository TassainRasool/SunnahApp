import WidgetKit
import SwiftUI

struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let prayers: [PrayerTime]
    let nextPrayerName: String
    let nextPrayerTime: String
}

struct PrayerTime: Decodable {
    let name: String
    let time: String
}

struct PrayerTimesData: Decodable {
    let list: [PrayerTime]
    let nextTime: String
}

struct Provider: TimelineProvider {
    let defaults = UserDefaults(suiteName: "group.com.app1.sunnah")

    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry(
            date: Date(),
            prayers: [
                PrayerTime(name: "Fajr", time: "5:30 AM"),
                PrayerTime(name: "Dhuhr", time: "12:30 PM"),
                PrayerTime(name: "Asr", time: "3:45 PM"),
                PrayerTime(name: "Maghrib", time: "6:15 PM"),
                PrayerTime(name: "Isha", time: "8:00 PM"),
            ],
            nextPrayerName: "Dhuhr",
            nextPrayerTime: "12:30 PM"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
        let entry = loadEntry() ?? placeholder(in: context)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
        let entry = loadEntry() ?? placeholder(in: context)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    func loadEntry() -> PrayerTimesEntry? {
        guard let data = defaults?.data(forKey: "sunnah_widget_prayer_data"),
              let decoded = try? JSONDecoder().decode(PrayerTimesData.self, from: data) else {
            return nil
        }
        let now = Date()
        let calendar = Calendar.current
        let currentHour = calendar.component(.hour, from: now)
        let currentMin = calendar.component(.minute, from: now)

        var nextName = ""
        for p in decoded.list {
            let parts = p.time.replacingOccurrences(of: " AM", with: "").replacingOccurrences(of: " PM", with: "").split(separator: ":")
            if parts.count == 2, let hour = Int(parts[0]), let min = Int(parts[1]) {
                let isPM = p.time.contains("PM")
                let h24 = isPM && hour != 12 ? hour + 12 : (!isPM && hour == 12 ? 0 : hour)
                if h24 > currentHour || (h24 == currentHour && min > currentMin) {
                    nextName = p.name
                    break
                }
            }
        }
        if nextName.isEmpty {
            nextName = decoded.list.first?.name ?? ""
        }

        return PrayerTimesEntry(
            date: now,
            prayers: decoded.list,
            nextPrayerName: nextName,
            nextPrayerTime: decoded.nextTime
        )
    }
}

struct PrayerTimesWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(spacing: 4) {
            Text("Prayer Times")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Color(red: 0.83, green: 0.69, blue: 0.48))

            HStack(spacing: 4) {
                ForEach(entry.prayers, id: \.name) { prayer in
                    VStack(spacing: 2) {
                        Text(prayer.name)
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(
                                prayer.name == entry.nextPrayerName
                                    ? Color(red: 0.83, green: 0.69, blue: 0.48)
                                    : Color(red: 0.53, green: 0.53, blue: 0.67)
                            )
                        Text(prayer.time)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(
                                prayer.name == entry.nextPrayerName
                                    ? .white
                                    : Color(red: 0.53, green: 0.53, blue: 0.67)
                            )
                    }
                    .padding(4)
                    .background(
                        prayer.name == entry.nextPrayerName
                            ? Color(red: 0.12, green: 0.12, blue: 0.21)
                            : Color.clear
                    )
                    .cornerRadius(6)
                }
            }

            if !entry.nextPrayerTime.isEmpty {
                Text("Next: \(entry.nextPrayerName) · \(entry.nextPrayerTime)")
                    .font(.system(size: 8))
                    .foregroundColor(Color(red: 0.83, green: 0.69, blue: 0.48))
            }
        }
        .containerBackground(Color(red: 0.05, green: 0.05, blue: 0.10), for: .widget)
    }
}

@main
struct PrayerTimesWidgetExtension: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PrayerTimesWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Prayer Times")
        .description("Shows today's prayer times.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
