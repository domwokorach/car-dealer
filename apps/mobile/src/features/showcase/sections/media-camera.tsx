import { useRef, useState } from 'react';
import { Image, Modal, View } from 'react-native';
import { Attachment } from '@/components/panel/attachment';
import { Avatar } from '@/components/panel/avatar';
import { AvatarCropper, type AvatarCropperHandle } from '@/components/panel/avatar-cropper';
import { Camera } from '@/components/panel/camera';
import { Compare } from '@/components/panel/compare';
import { FileUpload } from '@/components/panel/file-upload';
import { Signature, type SignatureHandle } from '@/components/panel/signature';
import { Button, Text } from '@/components/ui';
import { Demo } from '../demo';

const icon = Image.resolveAssetSource(require('../../../../assets/icon.png'));

export function MediaCamera() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [shot, setShot] = useState<string>();
  const cropper = useRef<AvatarCropperHandle>(null);
  const [cropped, setCropped] = useState<string>();
  const pad = useRef<SignatureHandle>(null);
  return (
    <>
      <Demo title="Avatar"><Avatar fallback="CD" /></Demo>
      <Demo title="AvatarCropper" note="Pinch and drag; the cropped circle is returned as an image.">
        <AvatarCropper ref={cropper} source={{ uri: icon.uri, width: icon.width, height: icon.height }} style={{ height: 280 }}>
          <AvatarCropper.Canvas />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
            <AvatarCropper.Reset />
            <AvatarCropper.Rotate />
          </View>
        </AvatarCropper>
        <Button title="Crop" variant="secondary" onPress={async () => { const r = await cropper.current?.crop({ size: 256 }); setCropped(r?.uri); }} />
        {cropped ? <Avatar source={{ uri: cropped }} fallback="?" /> : null}
      </Demo>
      <Demo title="Camera" note="Asks for camera permission when opened, never before.">
        <Button title="Open camera" variant="secondary" onPress={() => setCameraOpen(true)} />
        {shot ? <Text variant="caption" tone="muted">Captured: {shot.split('/').pop()}</Text> : null}
        <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
          <Camera onCapture={(c) => { setShot(c.uri); setCameraOpen(false); }}>
            <Camera.Preview />
            <Camera.Header><Camera.Flash /></Camera.Header>
            <Camera.Footer>
              <Camera.Controls><Camera.Shutter /><Camera.Flip /></Camera.Controls>
            </Camera.Footer>
          </Camera>
        </Modal>
      </Demo>
      <Demo title="FileUpload" note="Photos, camera or files; validated locally (no upload target in the showcase).">
        <FileUpload sources={['camera', 'library', 'files']} accept={['image/*', 'application/pdf']} multiple maxFiles={5} maxSize={10 * 1024 * 1024}>
          <FileUpload.Dropzone />
          <FileUpload.List />
        </FileUpload>
      </Demo>
      <Demo title="Attachment">
        <Attachment state="uploading">
          <Attachment.Content>
            <Attachment.Title>service-history.pdf</Attachment.Title>
            <Attachment.Description>PDF · 2.4 MB</Attachment.Description>
          </Attachment.Content>
        </Attachment>
      </Demo>
      <Demo title="Compare" note="Drag the seam.">
        <Compare height={180}>
          <Compare.After><View className="flex-1 items-center justify-center bg-primary"><Text tone="inverse">After</Text></View></Compare.After>
          <Compare.Before><View className="flex-1 items-center justify-center bg-secondary"><Text>Before</Text></View></Compare.Before>
          <Compare.Handle />
        </Compare>
      </Demo>
      <Demo title="Signature">
        <Signature ref={pad} guideline />
        <Button title="Clear" variant="secondary" onPress={() => pad.current?.clear()} />
      </Demo>
    </>
  );
}
