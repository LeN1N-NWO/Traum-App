import { NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import { Toasts } from "@/components/toasts";

/* Die native Tab-Leiste — auf iOS 26 Liquid Glass vom System, auf Android
   Material 3. Fünf Tabs, der Traum in der Mitte mit gefülltem Plus (Antons
   Festlegung 11.09.: „nicht mehr so oben", dafür echt). Fünf ist genau das
   Android-Maximum. Jeder Tab zeigt heute den passenden Bildschirm der
   alten Oberfläche (LegacyTab); nativ werden sie einer nach dem anderen. */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <NativeTabs tintColor="#8cc0ff" minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: "moon.stars", selected: "moon.stars.fill" }} md="bedtime" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="journal">
          <NativeTabs.Trigger.Icon sf={{ default: "book.closed", selected: "book.closed.fill" }} md="menu_book" />
          <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="dream">
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
          <NativeTabs.Trigger.Label>Dream</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="sleep">
          <NativeTabs.Trigger.Icon sf={{ default: "bed.double", selected: "bed.double.fill" }} md="bed" />
          <NativeTabs.Trigger.Label>Sleep</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <Toasts />
    </>
  );
}
