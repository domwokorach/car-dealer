import { Message } from '@/components/panel/message';
import { MessageScroller } from '@/components/panel/message-scroller';
import { Marker } from '@/components/panel/marker';
import { Support } from '@/components/panel/support';
import { View } from 'react-native';
import { Demo } from '../demo';

const MESSAGES = [
  { id: '1', mine: false, text: 'Hello! How can we help?' },
  { id: '2', mine: true, text: 'Is the blue estate still available?' },
  { id: '3', mine: false, text: 'Yes, it is. Would you like a test drive?' },
];

export function MessagesSupport() {
  return (
    <>
      <Demo title="Support">
        <Support availability="online">
          <Support.Header title="Support" description="We usually reply within a day." />
          <Support.Channels>
            <Support.Channel label="Message the branch" />
            <Support.Channel label="Call us" detail="020 0000 0000" />
          </Support.Channels>
        </Support>
      </Demo>
      <Demo title="Message + MessageScroller">
        <View style={{ height: 260 }}>
          <MessageScroller autoScroll className="flex-1">
            <MessageScroller.Viewport>
              <MessageScroller.Content>
                {MESSAGES.map((m) => (
                  <MessageScroller.Item key={m.id} messageId={m.id}>
                    <Message align={m.mine ? 'end' : 'start'}>
                      <Message.Content>
                        <Message.Bubble><Message.BubbleContent>{m.text}</Message.BubbleContent></Message.Bubble>
                      </Message.Content>
                    </Message>
                  </MessageScroller.Item>
                ))}
              </MessageScroller.Content>
            </MessageScroller.Viewport>
            <MessageScroller.Button />
          </MessageScroller>
        </View>
      </Demo>
      <Demo title="Marker">
        <Marker><Marker.Content>Today</Marker.Content></Marker>
      </Demo>
    </>
  );
}
