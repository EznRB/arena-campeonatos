---
modificationDate: September 15, 2026
title: Camera
description: A React component that renders a preview for the device's front or back camera.
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-58/packages/expo-camera'
packageName: 'expo-camera'
exampleName: 'with-camera'
iconUrl: '/static/images/packages/expo-camera.png'
platforms: ['android*', 'ios*', 'web', 'expo-go']
---

This documentation is available as Markdown for AI agents and LLMs. See the [full Markdown index](https://docs.expo.dev/llms.txt) or append .md to any documentation URL.

# Expo Camera

A React component that renders a preview for the device's front or back camera.

<AgentInstructions>

## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

Preferred command:
npx --yes submit-expo-feedback@latest --category docs --subject "/versions/v58.0.0/sdk/camera/" "<actionable feedback>"

Direct HTTP fallback:
curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/versions/v58.0.0/sdk/camera/","feedback":"🤖 Agent feedback for docs: <specific, actionable description> (<model>, <harness>)"}'

Only submit when you have something specific and actionable to report. Try to give the most context.

## Navigation

When answering a related or follow-up question, use llms.txt to find the relevant page as Markdown (.md) instead of guessing.

You are here: Reference (v58.0.0) > Expo SDK (90 pages in this section)
Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)

</AgentInstructions>
Android (device only), iOS (device only), Web, Included in Expo Go

Recommended version: ~58.0.14

`expo-camera` provides a React component that renders a preview of the device's front or back camera. The camera's parameters such as zoom, torch, and flash mode are adjustable. Using `CameraView`, you can take photos and record videos that are saved to the app's cache. The component is also capable of detecting bar codes appearing in the preview. Run the [example](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#usage) on your device to see all these features working together.

## Installation

#### Install library

```sh
# npm
npx expo install expo-camera

# yarn
yarn expo install expo-camera

# pnpm
pnpm expo install expo-camera

# bun
bun expo install expo-camera
```

If you are installing this in an [existing React Native app](https://docs.expo.dev/bare/overview.md), make sure to [install `expo`](https://docs.expo.dev/bare/installing-expo-modules.md) in your project.

#### Start with an example

The [`with-camera`](https://github.com/expo/examples/tree/master/with-camera) example comes with `expo-camera` already installed and configured:

```sh
# npm
npx create-expo-app --example with-camera

# yarn
yarn create expo-app --example with-camera

# pnpm
pnpm create expo-app --example with-camera

# bun
bun create expo --example with-camera
```

## Configuration in app config

You can configure `expo-camera` using its built-in [config plugin](https://docs.expo.dev/config-plugins/introduction.md) if you use config plugins in your project ([Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation.md)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect. If your app does **not** use CNG, then you'll need to manually configure the library.

### Example app.json with config plugin

```json app.json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
          "recordAudioAndroid": true,
          "barcodeScannerEnabled": true
        }
      ]
    ]
  }
}
```

### Configurable properties

| Name | Default | Description |
| --- | --- | --- |
| `cameraPermission` | `"Allow $(PRODUCT_NAME) to access your camera"` | Only for: iOS. A string to set the [`NSCameraUsageDescription`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#ios) permission message. |
| `microphonePermission` | `"Allow $(PRODUCT_NAME) to access your microphone"` | Only for: iOS. A string to set the [`NSMicrophoneUsageDescription`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#ios) permission message. |
| `recordAudioAndroid` | `true` | Only for: Android. A boolean that determines whether to enable the `RECORD_AUDIO` permission on Android. |
| `barcodeScannerEnabled` | `true` | A boolean that determines whether to enable barcode scanning support. Disabling this reduces app size when barcode scanning is not needed. On Android, this option only takes effect when `expo-camera` builds from source. [Prebuilt modules](https://docs.expo.dev/guides/prebuilt-expo-modules.md) already include the barcode scanning libraries. To make this option apply, add `expo-camera` to `buildFromSource` in **package.json**. |

To localize the iOS camera or microphone permission message, add `NSCameraUsageDescription` or `NSMicrophoneUsageDescription` to the `ios` object in each [locale file](https://docs.expo.dev/guides/localization.md#translating-app-metadata). Keep `cameraPermission` and `microphonePermission` as the default values. Expo writes the localized values to **InfoPlist.strings** during prebuild.

#### Are you using this library in an existing React Native app?

If you're not using Continuous Native Generation ([CNG](https://docs.expo.dev/workflow/continuous-native-generation.md)) (you're using native **android** and **ios** projects manually), then you need to configure following permissions in your native projects:

**Android**

-   `expo-camera` automatically adds `android.permission.CAMERA` permission to your project's **android/app/src/main/AndroidManifest.xml**. If you want to record videos with audio, include `RECORD_AUDIO` permission:
    
    ```xml
    <!-- Added permission -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Only add when recording videos with audio -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    ```
    
-   Then, adjust the **android/build.gradle** file to add new maven block after all other repositories as show below:
    
    ```groovy
    allprojects {
      repositories {
          // * Your other repositories here *
          // * Add a new maven block after other repositories / blocks *
          maven {
              // expo-camera bundles a custom com.google.android:cameraview
              url "$rootDir/../node_modules/expo-camera/android/maven"
          }
      }
    }
    ```
    

**iOS**

-   Add `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` keys to your project's **ios/[app]/Info.plist**:
    
    ```xml
    <key>NSCameraUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your camera</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Allow $(PRODUCT_NAME) to access your microphone</string>
    ```
    

## Usage

> Only one Camera preview can be active at any given time. If you have multiple screens in your app, you should unmount `Camera` components whenever a screen is unfocused.

```tsx Basic Camera usage
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
```

### Advanced usage

[Camera app example](https://github.com/expo/examples/tree/master/with-camera) — A complete example that shows how to take a picture and display it. Written in TypeScript.

## Web support

Most browsers support a version of web camera functionality, you can check out the [web camera browser support here](https://caniuse.com/#feat=stream). Image URIs are always returned as base64 strings because local file system paths are unavailable in the browser.

### Chrome `iframe` usage

When using **Chrome versions 64+**, if you try to use a web camera in a cross-origin iframe nothing will render. To add support for cameras in your iframe simply add the attribute `allow="microphone; camera;"` to the iframe element:

```html
<iframe src="..." allow="microphone; camera;">
  <!-- <CameraView /> -->
</iframe>
```

## API

```js
import { CameraView } from 'expo-camera';
```

## Component

### `CameraView`

Supported platforms: Android, iOS, Web.

Type: React.[Component](https://react.dev/reference/react/Component)<[CameraViewProps](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameraviewprops)\>

CameraViewProps

### `active`

Supported platforms: iOS.

Optional • Type: `boolean` • Default: `true`

A boolean that determines whether the camera should be active. Useful in situations where the camera may not have unmounted but you still want to stop the camera session.

### `animateShutter`

Supported platforms: Android, iOS, Web.

Optional • Type: `boolean` • Default: `true`

A boolean that determines whether the camera shutter animation should be enabled.

### `autofocus`

Supported platforms: iOS.

Optional • Type: [FocusMode](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#focusmode) • Default: `off`

Indicates the focus mode to use.

### `barcodeScannerSettings`

Supported platforms: Android, iOS, Web.

Optional • Type: [BarcodeSettings](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodesettings)

Example

```tsx
<CameraView
  barcodeScannerSettings={{
    barcodeTypes: ["qr"],
  }}
/>
```

### `enableTorch`

Supported platforms: Android, iOS, Web.

Optional • Type: `boolean` • Default: `false`

A boolean to enable or disable the torch.

### `facing`

Supported platforms: Android, iOS, Web.

Optional • Type: [CameraType](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameratype) • Default: `'back'`

Camera facing. Use one of `CameraType`. When `front`, use the front-facing camera. When `back`, use the back-facing camera.

### `flash`

Supported platforms: Android, iOS, Web.

Optional • Type: [FlashMode](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#flashmode) • Default: `'off'`

Camera flash mode. Use one of `FlashMode` values. When `on`, the flash on your device will turn on when taking a picture. When `off`, it won't. Setting it to `auto` will fire flash if required.

### `mirror`

Supported platforms: Android, iOS, Web.

Optional • Type: `boolean` • Default: `false`

A boolean that determines whether the camera should mirror the image when using the front camera.

### `mode`

Supported platforms: Android, iOS, Web.

Optional • Type: [CameraMode](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameramode) • Default: `'picture'`

Used to select image or video output.

### `mute`

Supported platforms: Android, iOS, Web.

Optional • Type: `boolean` • Default: `false`

If present, video will be recorded with no sound.

### `onAvailableLensesChanged`

Supported platforms: iOS.

Optional • Type: (event: [AvailableLenses](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#availablelenses)) => void

Callback invoked when the cameras available lenses change.

event: [AvailableLenses](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#availablelenses)

result object that contains a `lenses` property containing an array of available lenses.

### `onBarcodeScanned`

Supported platforms: Android, iOS, Web.

Optional • Type: (scanningResult: [BarcodeScanningResult](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodescanningresult)) => void

Callback that is invoked when a barcode has been successfully scanned. The callback is provided with an object of the [`BarcodeScanningResult`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodescanningresult) shape, where the `type` refers to the barcode type that was scanned, and the `data` is the information encoded in the barcode (in this case of QR codes, this is often a URL). See [`BarcodeType`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodetype) for supported values.

### `onCameraReady`

Supported platforms: Android, iOS, Web.

Optional • Type: `() => void`

Callback invoked when camera preview has been set.

### `onMountError`

Supported platforms: Android, iOS, Web.

Optional • Type: (event: [CameraMountError](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameramounterror)) => void

Callback invoked when camera preview could not start.

event: [CameraMountError](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameramounterror)

Error object that contains a `message`.

### `onRecordingProgress`

Supported platforms: Android, iOS.

Optional • Type: (event: [RecordingProgress](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#recordingprogress)) => void

Callback invoked repeatedly while a video recording is in progress. The values are read from the native recorder, so they track the media actually written to disk. Progress events are not delivered while the recording is paused. The callback fires about every 500 milliseconds by default; configure the rate with `progressUpdateInterval` in the `recordAsync` options.

event: [RecordingProgress](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#recordingprogress)

Result object that contains the recorded `duration` and `fileSize`, plus the `maxDuration` passed to `recordAsync` when a limit was set.

### `onResponsiveOrientationChanged`

Supported platforms: iOS.

Optional • Type: (event: [ResponsiveOrientationChanged](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#responsiveorientationchanged)) => void

Callback invoked when responsive orientation changes. Only applicable if `responsiveOrientationWhenOrientationLocked` is `true`.

event: [ResponsiveOrientationChanged](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#responsiveorientationchanged)

result object that contains updated orientation of camera

### `pictureSize`

Supported platforms: Android, iOS, Web.

Optional • Type: `string`

A string representing the size of pictures [`takePictureAsync`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#takepictureasyncoptions) will take. Available sizes can be fetched with [`getAvailablePictureSizesAsync`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#getavailablepicturesizesasync). Setting this prop will cause the `ratio` prop to be ignored as the aspect ratio is determined by the selected size.

### `poster`

Supported platforms: Web.

Optional • Type: `string`

A URL for an image to be shown while the camera is loading.

### `ratio`

Supported platforms: Android.

Optional • Type: [CameraRatio](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameraratio)

A string representing the aspect ratio of the preview. For example, `4:3` and `16:9`. Note: Setting the aspect ratio here will change the scaleType of the camera preview from `FILL` to `FIT`. Also, when using 1:1, devices only support certain sizes. If you specify an unsupported size, the closest supported ratio will be used.

### `responsiveOrientationWhenOrientationLocked`

Supported platforms: iOS.

Optional • Type: `boolean`

Whether to allow responsive orientation of the camera when the screen orientation is locked (that is, when set to `true`, landscape photos will be taken if the device is turned that way, even if the app or device orientation is locked to portrait).

### `selectedLens`

Supported platforms: iOS.

Optional • Type: `string`

The `deviceType` identifier for the lens to use. Retrieve available lenses by calling [`getAvailableLensesAsync`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#getavailablelensesasync) or listening to the `onAvailableLensesChanged` callback, then pass the `deviceType` value from the returned `LensInfo` objects.

Common values include:

-   `"AVCaptureDeviceTypeBuiltInWideAngleCamera"` - Standard wide angle camera
-   `"AVCaptureDeviceTypeBuiltInUltraWideCamera"` - Ultra wide angle camera
-   `"AVCaptureDeviceTypeBuiltInTelephotoCamera"` - Telephoto camera

If not specified or if the value doesn't match an available lens, the default camera for the current position (front/back) is used.

You can read more about device types in the [Apple documentation](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct).

Example

```tsx
const lenses = await cameraRef.current.getAvailableLensesAsync();
const ultraWide = lenses.find(l => l.deviceType === 'AVCaptureDeviceTypeBuiltInUltraWideCamera');
if (ultraWide) {
  setSelectedLens(ultraWide.deviceType);
}
```

### `videoBitrate`

Supported platforms: Android, iOS, Web.

Optional • Type: `number`

The bitrate of the video recording in bits per second. Note: On iOS, you must specify the video codec when calling `recordAsync` to use this option.

Example

`10_000_000`

### `videoQuality`

Supported platforms: Android, iOS, Web.

Optional • Type: [VideoQuality](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#videoquality)

Specify the quality of the recorded video. Use one of `VideoQuality` possible values: for 16:9 resolution `2160p`, `1080p`, `720p`, `480p` : `Android only` and for 4:3 `4:3` (the size is 640x480). If the chosen quality is not available for a device, the highest available is chosen.

### `videoStabilizationMode`

Supported platforms: Android, iOS, Web.

Optional • Type: [VideoStabilization](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#videostabilization) • Default: `'auto'`

The video stabilization mode used for a video recording. Use one of [`VideoStabilization.<value>`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#videostabilization). You can read more about each stabilization type in [Apple Documentation](https://developer.apple.com/documentation/avfoundation/avcapturevideostabilizationmode).

### `zoom`

Supported platforms: Android, iOS, Web.

Optional • Type: `number` • Default: `0`

A value between `0` and `1` being a percentage of device's max zoom, where `0` means not zoomed and `1` means maximum zoom.

#### Inherited props

-   [ViewProps](https://reactnative.dev/docs/view#props)

## Static methods

### `dismissScanner()`

Supported platforms: iOS.

Dismiss the scanner presented by `launchScanner`.

> On Android, the scanner is dismissed automatically when a barcode is scanned.

Returns: `Promise<void>`

### `getAvailableVideoCodecsAsync()`

Supported platforms: iOS.

Queries the device for the available video codecs that can be used in video recording.

Returns: `Promise<VideoCodec[]>`

A promise that resolves to a list of strings that represents available codecs.

### `isAvailableAsync()`

Supported platforms: Web.

Check whether the current device has a camera. This is useful for web and simulators cases. This isn't influenced by the Permissions API (all platforms), or HTTP usage (in the browser). You will still need to check if the native permission has been accepted.

Returns: `Promise<boolean>`

### `launchScanner(options)`

Supported platforms: Android, iOS.

| Parameter | Type |
| --- | --- |
| `options`(optional) | [ScanningOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#scanningoptions) |

  

On Android, we will use the [Google code scanner](https://developers.google.com/ml-kit/vision/barcode-scanning/code-scanner). On iOS, presents a modal view controller that uses the [`DataScannerViewController`](https://developer.apple.com/documentation/visionkit/scanning_data_with_the_camera) available on iOS 16+.

Returns: `Promise<void>`

### `onModernBarcodeScanned(listener)`

Supported platforms: Android, iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `listener` | (event: [ScanningResult](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#scanningresult)) => void | Invoked with the [ScanningResult](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#scanningresult) when a bar code has been successfully scanned. |

  

Invokes the `listener` function when a bar code has been successfully scanned. The callback is provided with an object of the `ScanningResult` shape, where the `type` refers to the bar code type that was scanned and the `data` is the information encoded in the bar code (in this case of QR codes, this is often a URL). See [`BarcodeType`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodetype) for supported values.

Returns: `EventSubscription`

### `scanDocumentAsync(options)`

Supported platforms: Android, iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [DocumentScanningOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#documentscanningoptions) | A map of `DocumentScanningOptions`. |

  

Presents the system document scanner and returns the captured pages once the user saves. On iOS, this uses VisionKit's [`VNDocumentCameraViewController`](https://developer.apple.com/documentation/visionkit/vndocumentcameraviewcontroller); on Android it uses the [ML Kit document scanner](https://developers.google.com/ml-kit/vision/doc-scanner).

The page images and the optional PDF are written to the app's cache directory, so copy them to a permanent location with [`expo-file-system`](https://docs.expo.dev/versions/latest/sdk/filesystem.md) if you need to keep them.

Returns: `Promise<DocumentScanningResult | null>`

A promise that resolves to a [`DocumentScanningResult`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#documentscanningresult), or `null` if the user cancels the scan or the scanner is unavailable on the device.

Example

```ts
const result = await CameraView.scanDocumentAsync({ requestPdf: true });
if (result) {
  console.log(result.pages); // ['file:///.../DocumentScanner/<uuid>.jpg', ...]
  console.log(result.pdfUri); // 'file:///.../DocumentScanner/<uuid>.pdf'
}
```

## Component methods

### `getAvailableLensesAsync()`

Supported platforms: iOS.

Returns the available lenses for the currently selected camera.

Returns: `Promise<LensInfo[]>`

An array of `LensInfo` objects containing both the stable `deviceType` identifier and the `localizedName` for display purposes. The `deviceType` can be passed to the `selectedLens` prop.

### `getAvailablePictureSizesAsync()`

Supported platforms: Android, iOS, Web.

Get picture sizes that are supported by the device.

Returns: `Promise<string[]>`

Returns a Promise that resolves to an array of strings representing picture sizes that can be passed to `pictureSize` prop. The list varies across Android devices but is the same for every iOS.

### `getSupportedFeatures()`

Supported platforms: Android, iOS, Web.

Returns an object with the supported features of the camera on the current device.

Returns: `{ isModernBarcodeScannerAvailable: boolean, toggleRecordingAsyncAvailable: boolean }`

### `pausePreview()`

Supported platforms: Android, iOS, Web.

Pauses the camera preview. It is not recommended to use `takePictureAsync` when preview is paused.

Returns: `Promise<void>`

### `recordAsync(options)`

Supported platforms: Android, iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [CameraRecordingOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#camerarecordingoptions) | A map of `CameraRecordingOptions` type. |

  

Starts recording a video that will be saved to cache directory. Videos are rotated to match device's orientation. Flipping camera during a recording results in stopping it.

Returns: `Promise<{ uri: string } | undefined>`

Returns a Promise that resolves to an object containing video file `uri` property and a `codec` property on iOS. The Promise is returned if `stopRecording` was invoked, one of `maxDuration` and `maxFileSize` is reached or camera preview is stopped.

### `resumePreview()`

Supported platforms: Android, iOS, Web.

Resumes the camera preview.

Returns: `Promise<void>`

### `stopRecording()`

Supported platforms: Android, iOS.

Stops recording if any is in progress.

Returns: `void`

### `takePictureAsync(optionsWithRef)`

Supported platforms: Android, iOS, Web.

Overload #1

| Parameter | Type | Description |
| --- | --- | --- |
| `optionsWithRef` | [CameraPictureOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#camerapictureoptions) & { pictureRef: true } | An object in form of `CameraPictureOptions` type and `pictureRef` key set to `true`. |

  

Takes a picture and returns an object that references the native image instance.

> **Note**: Make sure to wait for the [`onCameraReady`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#oncameraready) callback before calling this method.

> **Note:** Avoid calling this method while the preview is paused. On Android, this will throw an error. On iOS, this will take a picture of the last frame that is currently on screen.

Returns: `Promise<PictureRef>`

Returns a Promise that resolves to `PictureRef` class which contains basic image data, and a reference to native image instance which can be passed to other Expo packages supporting handling such an instance.

### `takePictureAsync(options)`

Supported platforms: Android, iOS, Web.

Overload #2

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [CameraPictureOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#camerapictureoptions) | An object in form of `CameraPictureOptions` type. |

  

Takes a picture and saves it to app's cache directory. Photos are rotated to match device's orientation (if `options.skipProcessing` flag is not enabled) and scaled to match the preview.

> **Note**: Make sure to wait for the [`onCameraReady`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#oncameraready) callback before calling this method.

> **Note:** Avoid calling this method while the preview is paused. On Android, this will throw an error. On iOS, this will take a picture of the last frame that is currently on screen.

Returns: `Promise<CameraCapturedPicture>`

Returns a Promise that resolves to `CameraCapturedPicture` object, where `uri` is a URI to the local image file on Android, iOS, and a base64 string on web (usable as the source for an `Image` element). The `width` and `height` properties specify the dimensions of the image.

`base64` is included if the `base64` option was truthy, and is a string containing the JPEG data of the image in Base64. Prepend it with `'data:image/jpg;base64,'` to get a data URI, which you can use as the source for an `Image` element for example.

`exif` is included if the `exif` option was truthy, and is an object containing EXIF data for the image. The names of its properties are EXIF tags and their values are the values for those tags.

> On native platforms, the local image URI is temporary. Use [`FileSystem.copy`](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem.md#copydestination-options-1) to make a permanent copy of the image.

### `toggleRecordingAsync()`

Supported platforms: Android, iOS, Web.

Pauses or resumes the video recording. Only has an effect if there is an active recording. On `iOS`, this method only supported on `iOS` 18.

Returns: `Promise<void | undefined>`

Example

```ts
const { toggleRecordingAsyncAvailable } = getSupportedFeatures()

return (
 {toggleRecordingAsyncAvailable && (
   <Button title="Toggle Recording" onPress={toggleRecordingAsync} />
 )}
)
```

## Hooks

### `useCameraPermissions(options)`

Supported platforms: Android, iOS, Web.

| Parameter | Type |
| --- | --- |
| `options`(optional) | `PermissionHookOptions<object>` |

  

Check or request permissions to access the camera. This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.

Returns: `[PermissionResponse | null, RequestPermissionMethod<PermissionResponse>, GetPermissionMethod<PermissionResponse>]`

Example

```ts
const [status, requestPermission] = useCameraPermissions();
```

### `useMicrophonePermissions(options)`

Supported platforms: Android, iOS, Web.

| Parameter | Type |
| --- | --- |
| `options`(optional) | `PermissionHookOptions<object>` |

  

Check or request permissions to access the microphone. This uses both `requestMicrophonePermissionsAsync` and `getMicrophonePermissionsAsync` to interact with the permissions.

Returns: `[PermissionResponse | null, RequestPermissionMethod<PermissionResponse>, GetPermissionMethod<PermissionResponse>]`

Example

```ts
const [status, requestPermission] = Camera.useMicrophonePermissions();
```

## Classes

### `CameraNativeModule`

Supported platforms: Android, iOS, Web.

Type: Class extends [NativeModule](https://docs.expo.dev/versions/v58.0.0/sdk/expo.md#nativemoduletype)<[CameraEvents](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameraevents)\>

CameraNativeModule Properties

### `dismissScanner`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void\>

### `FlashMode`

Supported platforms: Android, iOS, Web.

Read only • Type: Record<keyof [FlashMode](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#flashmode), CameraNativeProps[flashMode]\>

### `getAvailableVideoCodecsAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[VideoCodec[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#videocodec)\>

### `getCameraPermissionsAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<PermissionResponse\>

### `getMicrophonePermissionsAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<PermissionResponse\>

### `isAvailableAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<boolean\>

### `isDocumentScannerAvailable`

Supported platforms: Android, iOS, Web.

Read only • Type: `boolean`

### `isModernBarcodeScannerAvailable`

Supported platforms: Android, iOS, Web.

Read only • Type: `boolean`

### `launchScanner`

Supported platforms: Android, iOS, Web.

Read only • Type: (options?: [ScanningOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#scanningoptions)) => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void\>

### `requestCameraPermissionsAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<PermissionResponse\>

### `requestMicrophonePermissionsAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: () => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<PermissionResponse\>

### `scanDocumentAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: (options?: [DocumentScanningOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#documentscanningoptions)) => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[DocumentScanningResult](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#documentscanningresult) | null\>

### `scanFromURLAsync`

Supported platforms: Android, iOS, Web.

Read only • Type: (url: string, barcodeTypes?: [BarcodeType[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodetype)) => [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[BarcodeScanningResult[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodescanningresult)\>

### `toggleRecordingAsyncAvailable`

Supported platforms: Android, iOS, Web.

Read only • Type: `boolean`

### `Type`

Supported platforms: Android, iOS, Web.

Read only • Type: Record<keyof [CameraType](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameratype), CameraNativeProps[facing]\>

### `PictureRef`

Supported platforms: Android, iOS, Web.

Type: Class extends [SharedRef](https://docs.expo.dev/versions/v58.0.0/sdk/expo.md#sharedreftype)<'image'\>

A reference to a native instance of the image.

PictureRef Properties

### `height`

Supported platforms: Android, iOS, Web.

Type: `number`

Height of the image.

### `nativeRefType`

Supported platforms: Android, iOS, Web.

Type: `string`

The type of the native reference.

### `width`

Supported platforms: Android, iOS, Web.

Type: `number`

Width of the image.

PictureRef Methods

### `savePictureAsync(options)`

Supported platforms: Android, iOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [SavePictureOptions](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#savepictureoptions) | A map defining how modified image should be saved. |

  

Saves the image to the file system in the cache directory.

Returns: `Promise<PhotoResult>`

## Methods

### `Camera.scanFromURLAsync(url, barcodeTypes)`

Supported platforms: Android, iOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `url` | `string` | URL to get the image from. |
| `barcodeTypes`(optional) | [BarcodeType[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodetype) | An array of bar code types. Defaults to all supported bar code types on the platform. Note: Only QR codes are supported on iOS. On android, the barcode should take up the majority of the image for best results. |

  

Scan bar codes from the image at the given URL.

Returns: `Promise<BarcodeScanningResult[]>`

A possibly empty array of objects of the `BarcodeScanningResult` shape, where the type refers to the barcode type that was scanned and the data is the information encoded in the barcode.

## Interfaces

### `Subscription`

Supported platforms: Android, iOS, Web.

A subscription object that allows to conveniently remove an event listener from the emitter.

Subscription Methods

### `remove()`

Supported platforms: Android, iOS, Web.

Removes an event listener for which the subscription has been created. After calling this function, the listener will no longer receive any events from the emitter.

Returns: `void`

## Types

### `AvailableLenses`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| lenses | [LensInfo[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#lensinfo) | - |

### `BarcodeBounds`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| origin | [BarcodePoint](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodepoint) | The origin point of the bounding box. |
| size | [BarcodeSize](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodesize) | The size of the bounding box. |

### `BarcodePoint`

Supported platforms: Android, iOS, Web.

Type: [Point](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#point)

These coordinates are represented in the coordinate space of the camera source (e.g. when you are using the camera view, these values are adjusted to the dimensions of the view).

### `BarcodeScanningResult`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| bounds | [BarcodeBounds](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodebounds) | The [`BarcodeBounds`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodebounds) object. `bounds` in some case will be representing an empty rectangle. Moreover, `bounds` doesn't have to bound the whole barcode. For some types, they will represent the area used by the scanner. |
| cornerPoints | [BarcodePoint[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodepoint) | Corner points of the bounding box. `cornerPoints` is not always available and may be empty. On iOS, for `code39` and `pdf417` you don't get this value. **Note:** Corner points order is currently different across platforms. On Android, [Google MLKit's native order](https://developers.google.com/android/reference/com/google/mlkit/vision/barcode/common/Barcode#getCornerPoints\(\)) is used, which is `topLeft`, `topRight`, `bottomRight`, `bottomLeft`. On iOS, the order is `bottomLeft`, `bottomRight`, `topLeft`, `topRight`. On Web, the order is `topLeft`, `topRight`, `bottomRight`, `bottomLeft` (matching Android/BarcodeDetector order). |
| data | `string` | The parsed information encoded in the barcode. |
| extra(optional) | `AndroidBarcode` | Supported platforms: Android. Extra information returned by the specific type of barcode. |
| type | `string` | The barcode type. |

### `BarcodeSettings`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| barcodeTypes | [BarcodeType[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodetype) | - |

### `BarcodeSize`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| height | `number` | The height value. |
| width | `number` | The width value. |

### `BarcodeType`

Supported platforms: Android, iOS, Web.

Literal type: `string`

The available barcode types that can be scanned.

Acceptable values are: `'aztec'` | `'ean13'` | `'ean8'` | `'qr'` | `'pdf417'` | `'upc_e'` | `'datamatrix'` | `'code39'` | `'code93'` | `'itf14'` | `'codabar'` | `'code128'` | `'upc_a'`

### `CameraCapturedPicture`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| base64(optional) | `string` | A Base64 representation of the image. |
| exif(optional) | [Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<[MediaTrackSettings](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings)\> | any | On Android and iOS this object may include various fields based on the device and operating system. On web, it is a partial representation of the [`MediaTrackSettings`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings) dictionary. |
| format | `'jpg' | 'png'` | The format of the captured image. |
| height | `number` | Captured image height. |
| uri | `string` | On web, the value of `uri` is the same as `base64` because file system URLs are not supported in the browser. |
| width | `number` | Captured image width. |

### `CameraEvents`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| onModernBarcodeScanned | (event: [ScanningResult](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#scanningresult)) => void | - |

### `CameraMode`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Acceptable values are: `'picture'` | `'video'`

### `CameraMountError`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| message | `string` | - |

### `CameraOrientation`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Acceptable values are: `'portrait'` | `'portraitUpsideDown'` | `'landscapeLeft'` | `'landscapeRight'`

### `CameraPictureOptions`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| additionalExif(optional) | `Record<string, any>` | Supported platforms: Android, iOS. Additional EXIF data to be included for the image. Only useful when `exif` option is set to `true`. Keys are standard EXIF tag names, for example `UserComment`, `ImageDescription`, or `GPSLatitude`. The native writers ignore any other key without an error. Android writes only the tags that `ExifInterface` knows. iOS merges the values into the image's EXIF dictionary, and ImageIO writes only the tags it recognizes. A custom key such as `Address` never reaches the file. `GPSLatitude` and `GPSLongitude` accept signed decimal degrees. Both platforms convert them to the EXIF GPS format and set the hemisphere reference tags. |
| base64(optional) | `boolean` | Whether to also include the image data in Base64 format. |
| exif(optional) | `boolean` | Whether to also include the EXIF data for the image. |
| imageType(optional) | [ImageType](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#imagetype) | Supported platforms: Web. |
| isImageMirror(optional) | `boolean` | Supported platforms: Web. |
| mirror(optional) | `boolean` | Deprecated: Use mirror prop on CameraView instead. Supported platforms: Android, iOS. When set to `true`, the output image will be flipped along the vertical axis when using the front camera. Default: `false` |
| onPictureSaved(optional) | (picture: [CameraCapturedPicture](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameracapturedpicture)) => void | A callback invoked when picture is saved. If set, the promise of this method will resolve immediately with no data after picture is captured. The data that it should contain will be passed to this callback. If displaying or processing a captured photo right after taking it is not your case, this callback lets you skip waiting for it to be saved. |
| pictureRef(optional) | `boolean` | Whether the camera should return an image ref that can be used directly in the `Image` component. |
| quality(optional) | `number` | Specify the compression quality from `0` to `1`. `0` means compress for small size, and `1` means compress for maximum quality. Default: `1` |
| scale(optional) | `number` | Supported platforms: Web. |
| shutterSound(optional) | `boolean` | To programmatically disable the camera shutter sound. Default: `true` |
| skipProcessing(optional) | `boolean` | If set to `true`, camera skips orientation adjustment and returns an image straight from the device's camera. If enabled, `quality` option is discarded (processing pipeline is skipped as a whole). Although enabling this option reduces image delivery time significantly, it may cause the image to appear in a wrong orientation in the `Image` component (at the time of writing, it does not respect EXIF orientation of the images). Note: Enabling skipProcessing would cause orientation uncertainty. Image component does not respect EXIF stored orientation information, that means obtained image would be displayed wrongly (rotated by 90°, 180° or 270°). Different devices provide different orientations. For example some Sony Xperia or Samsung devices don't provide correctly oriented images by default. To always obtain correctly oriented image disable skipProcessing option. |

### `CameraRatio`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Acceptable values are: `'4:3'` | `'16:9'` | `'1:1'`

### `CameraRecordingOptions`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| codec(optional) | [VideoCodec](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#videocodec) | Supported platforms: iOS. This option specifies what codec to use when recording the video. See [`VideoCodec`](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#videocodec) for the possible values. |
| maxDuration(optional) | `number` | Maximum video duration in seconds. |
| maxFileSize(optional) | `number` | Maximum video file size in bytes. |
| mirror(optional) | `boolean` | Deprecated: Use mirror prop on CameraView instead. If `true`, the recorded video will be flipped along the vertical axis. iOS flips videos recorded with the front camera by default, but you can reverse that back by setting this to `true`. On Android, this is handled in the user's device settings. |
| progressUpdateInterval(optional) | `number` | How often the `onRecordingProgress` event is delivered, in seconds. Values below `0.1` are clamped to `0.1`. Default: `0.5` |

### `CameraType`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Acceptable values are: `'front'` | `'back'`

### `DocumentScanningOptions`

Supported platforms: Android, iOS.

| Property | Type | Description |
| --- | --- | --- |
| quality(optional) | `number` | The JPEG compression quality of the saved page images, between `0` and `1`. `0` means compress for the smallest size, `1` means compress for maximum quality. Has no effect on Android, where the ML Kit scanner controls image compression. Default: `1` |
| requestPdf(optional) | `boolean` | Whether to also produce a multi-page PDF of the scan in addition to per-page images. Default: `false` |

### `DocumentScanningResult`

Supported platforms: Android, iOS.

| Property | Type | Description |
| --- | --- | --- |
| pages | `string[]` | An ordered array of `file://` URIs, one per scanned page image. |
| pdfUri(optional) | `string` | A `file://` URI of the generated multi-page PDF. Only present when `requestPdf` was `true`. |

### `FlashMode`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Flash mode for the camera.

-   `off` - Flash is disabled.
-   `on` - Flash will fire for every capture.
-   `auto` - Flash will fire automatically when required.
-   `screen` - Uses the device screen as a flash for front camera selfies. On Android, this uses CameraX's dedicated screen flash mode. On iOS, this maps to 'on' which triggers Retina Flash automatically.

Acceptable values are: `'off'` | `'on'` | `'auto'` | `'screen'`

### `FocusMode`

Supported platforms: Android, iOS, Web.

Literal type: `string`

This option specifies the mode of focus on the device.

-   `on` - Indicates that the device should autofocus once and then lock the focus.
-   `off` - Indicates that the device should automatically focus when needed.

Default: `off`

Acceptable values are: `'on'` | `'off'`

### `ImageType`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Acceptable values are: `'png'` | `'jpg'`

### `LensInfo`

Supported platforms: Android, iOS, Web.

Information about an available camera lens.

| Property | Type | Description |
| --- | --- | --- |
| deviceType | `string` | The stable device type identifier (for example, `"AVCaptureDeviceTypeBuiltInUltraWideCamera"`). Use this value for the `selectedLens` prop. |
| localizedName | `string` | The localized display name for the lens (for example, `"Back Ultra Wide Camera"`). Use this for displaying lens options in the UI. |

### `PermissionExpiration`

Supported platforms: Android, iOS, Web.

Literal type: `union`

Permission expiration time. Currently, all permissions are granted permanently.

Acceptable values are: `'never'` | `number`

### `PermissionHookOptions`

Supported platforms: Android, iOS, Web.

Literal type: `union`

Acceptable values are: `PermissionHookBehavior` | `Options`

### `PermissionResponse`

Supported platforms: Android, iOS, Web.

An object obtained by permissions get and request functions.

| Property | Type | Description |
| --- | --- | --- |
| canAskAgain | `boolean` | Indicates if user can be asked again for specific permission. If not, one should be directed to the Settings app in order to enable/disable the permission. |
| expires | `PermissionExpiration` | Determines time when the permission expires. |
| granted | `boolean` | A convenience boolean that indicates if the permission is granted. |
| status | [PermissionStatus](https://docs.expo.dev/versions/latest/sdk/expo.md#permissionstatus) | Determines the status of the permission. |

### `PhotoResult`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| base64(optional) | `string` | A Base64 representation of the image. |
| height | `number` | Height of the image. |
| uri | `string` | A URI to the modified image (usable as the source for an `Image` or `Video` element). |
| width | `number` | Width of the image. |

### `Point`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| x | `number` | - |
| y | `number` | - |

### `RecordingProgress`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| duration | `number` | The duration of the media recorded so far, in seconds. |
| fileSize | `number` | The size of the video file recorded so far, in bytes. |
| maxDuration(optional) | `number` | The `maxDuration` passed to `recordAsync`, in seconds. Only present when a limit was set. |

### `ResponsiveOrientationChanged`

Supported platforms: Android, iOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| orientation | [CameraOrientation](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#cameraorientation) | - |

### `SavePictureOptions`

Supported platforms: Android, iOS, Web.

A map defining how modified image should be saved.

| Property | Type | Description |
| --- | --- | --- |
| base64(optional) | `boolean` | Whether to also include the image data in Base64 format. |
| metadata(optional) | `Record<string, any>` | Additional metadata to be included for the image. |
| quality(optional) | `number` | Specify the compression quality from `0` to `1`. `0` means compress for small size, and `1` means compress for maximum quality. |

### `ScanningOptions`

Supported platforms: iOS.

| Property | Type | Description |
| --- | --- | --- |
| barcodeTypes | [BarcodeType[]](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodetype) | The type of codes to scan for. |
| isGuidanceEnabled(optional) | `boolean` | Supported platforms: iOS. Guidance text, such as “Slow Down,” appears over the live video. Default: `true` |
| isHighlightingEnabled(optional) | `boolean` | Supported platforms: iOS. Indicates whether the scanner displays highlights around recognized items. Default: `false` |
| isPinchToZoomEnabled(optional) | `boolean` | Supported platforms: iOS. Indicates whether people can use a two-finger pinch-to-zoom gesture. Default: `true` |

### `ScanningResult`

Supported platforms: Android, iOS, Web.

Type: [Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)<[BarcodeScanningResult](https://docs.expo.dev/versions/v58.0.0/sdk/camera.md#barcodescanningresult), 'bounds' | 'cornerPoints'\>

### `VideoCodec`

Supported platforms: iOS.

Literal type: `string`

This option specifies what codec to use when recording a video.

Acceptable values are: `'avc1'` | `'hvc1'` | `'jpeg'` | `'apcn'` | `'ap4h'`

### `VideoQuality`

Supported platforms: Android, iOS, Web.

Literal type: `string`

Acceptable values are: `'2160p'` | `'1080p'` | `'720p'` | `'480p'` | `'4:3'`

### `VideoStabilization`

Supported platforms: Android, iOS, Web.

Literal type: `string`

This option specifies the stabilization mode to use when recording a video.

-   `off` - No stabilization.
-   `standard` - Standard stabilization.
-   `cinematic` - Cinematic stabilization (provides more aggressive stabilization).
-   `auto` - The system automatically chooses the best stabilization mode.

On Android, `standard`, `cinematic`, and `auto` all enable video stabilization, while `off` disables it. The specific stabilization method is determined by the device.

Acceptable values are: `'off'` | `'standard'` | `'cinematic'` | `'auto'`

## Enums

### `PermissionStatus`

Supported platforms: Android, iOS, Web.

#### `DENIED`

`PermissionStatus.DENIED = "denied"`

User has denied the permission.

#### `GRANTED`

`PermissionStatus.GRANTED = "granted"`

User has granted the permission.

#### `UNDETERMINED`

`PermissionStatus.UNDETERMINED = "undetermined"`

User hasn't granted or denied the permission yet.

## Permissions

### Android

This package automatically adds the `CAMERA` permission to your app. If you want to record videos with audio, you have to include the `RECORD_AUDIO` in your **app.json** inside the [`expo.android.permissions`](https://docs.expo.dev/versions/v58.0.0/config/app.md#permissions) array.

| Android permission | Description |
| --- | --- |
| `CAMERA` | Required to be able to access the camera device. |
| `RECORD_AUDIO` | Allows an application to record audio. |

### iOS

The following usage description keys are used by this library:

| Info.plist key | Description |
| --- | --- |
| `NSCameraUsageDescription` | A message that tells the user why the app is requesting access to the device’s camera. |
| `NSMicrophoneUsageDescription` | A message that tells the user why the app is requesting access to the device’s microphone. |

