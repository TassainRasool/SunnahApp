import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetPrayerData } from '../services/widgetService';

const BG_COLOR = '#0e0e1a';
const GOLD = '#d4af7a';
const TEXT = '#e8e8f0';
const MUTED = '#8888aa';
const CARD = '#1e1e35';

function to12h(time) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export async function renderPrayerTimesWidget() {
  const data = await getWidgetPrayerData();
  return data ? renderPrayerTimes(data) : renderLoading();
}

function renderPrayerTimes(data) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  let nextName = '';
  for (const p of data.list) {
    const [h, m] = p.time.split(':').map(Number);
    if (h > currentHour || (h === currentHour && m > currentMin)) {
      nextName = p.name;
      break;
    }
  }
  if (!nextName) nextName = data.list[0]?.name;

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG_COLOR,
        width: 'match_parent',
        height: 'match_parent',
        padding: 10,
      }}
    >
      <TextWidget
        text="Prayer Times"
        style={{ fontSize: 14, color: GOLD, fontWeight: 'bold' }}
      />
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          flexGap: 3,
          marginTop: 6,
        }}
      >
        {data.list.map((p) => (
          <FlexWidget
            key={p.name}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: p.name === nextName ? CARD : 'transparent',
              paddingHorizontal: 6,
              paddingVertical: 5,
              borderRadius: 8,
            }}
          >
            <TextWidget
              text={p.name}
              style={{
                fontSize: 10,
                color: p.name === nextName ? GOLD : MUTED,
                fontWeight: '600',
              }}
            />
            <TextWidget
              text={to12h(p.time)}
              style={{
                fontSize: 13,
                color: p.name === nextName ? TEXT : MUTED,
                fontWeight: '700',
                marginTop: 2,
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
      {data.nextTime ? (
        <TextWidget
          text={`Next: ${nextName} · ${to12h(data.nextTime)}`}
          style={{ fontSize: 10, color: GOLD, marginTop: 4 }}
        />
      ) : null}
    </FlexWidget>
  );
}

function renderLoading() {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG_COLOR,
        width: 'match_parent',
        height: 'match_parent',
      }}
    >
      <TextWidget
        text="Open Sunnah to load"
        style={{ fontSize: 11, color: MUTED }}
      />
    </FlexWidget>
  );
}
