import { Text, Timeline } from '@plocks/ui';

const events = [
  { time: '09:30', title: 'Order placed', description: 'Payment confirmed and receipt sent.' },
  { time: '11:15', title: 'Packed', description: 'Items picked and boxed at the warehouse.' },
  { time: '14:00', title: 'Shipped', description: 'Handed to the carrier for delivery.' },
  { time: 'Tomorrow', title: 'Out for delivery', description: 'Expected before 6pm.' },
];

export function Demo() {
  return (
    <Timeline active={2}>
      {events.map((event) => (
        <Timeline.Item key={event.title} title={event.title} opposite={event.time}>
          <Text size="sm">{event.description}</Text>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
