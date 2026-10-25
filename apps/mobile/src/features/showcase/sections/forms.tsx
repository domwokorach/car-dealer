import { useState } from 'react';
import { View } from 'react-native';
import { Checkbox } from '@/components/panel/checkbox';
import { ColorPicker } from '@/components/panel/color-picker';
import { Field } from '@/components/panel/field';
import { OtpInput } from '@/components/panel/otp-input';
import { Rating } from '@/components/panel/rating';
import { SearchBar } from '@/components/panel/search-bar';
import { Select } from '@/components/panel/select';
import { Switch } from '@/components/panel/switch';
import { Input } from '@/components/ui';
import { Demo } from '../demo';

export function Forms() {
  const [on, setOn] = useState(true);
  const [checked, setChecked] = useState(false);
  const [fuel, setFuel] = useState('petrol');
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [colour, setColour] = useState('#00A1DE');
  return (
    <>
      <Demo title="Input + Field"><Field><Input label="Full name" /></Field></Demo>
      <Demo title="Input error"><Input label="Email" error="Enter a valid email" /></Demo>
      <Demo title="SearchBar"><SearchBar placeholder="Search cars" value={q} onChangeText={setQ} /></Demo>
      <Demo title="Select">
        <Select value={fuel} onValueChange={setFuel}>
          {['petrol', 'diesel', 'hybrid', 'electric'].map((f) => <Select.Item key={f} value={f} label={f} />)}
        </Select>
      </Demo>
      <Demo title="Checkbox"><Checkbox label="Pre-owned" checked={checked} onCheckedChange={setChecked} /></Demo>
      <Demo title="Switch">
        <Field orientation="horizontal">
          <Field.Content><Field.Title>Available only</Field.Title></Field.Content>
          <Switch value={on} onValueChange={setOn} accessibilityLabel="Available only" />
        </Field>
      </Demo>
      <Demo title="Rating"><Rating defaultValue={3} /></Demo>
      <Demo title="OtpInput" note={code.length === 6 ? 'Complete' : 'Type six digits'}><OtpInput value={code} onChangeText={setCode} /></Demo>
      <Demo title="ColorPicker" note={colour}>
        <ColorPicker defaultValue="#00A1DE" onValueCommit={setColour}>
          <ColorPicker.Area />
          <ColorPicker.Hue />
          <ColorPicker.Preview showValue />
        </ColorPicker>
      </Demo>
      <View />
    </>
  );
}
