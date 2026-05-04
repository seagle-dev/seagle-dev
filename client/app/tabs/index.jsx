// app/tabs/index.jsx
import React from 'react';
import { Redirect } from 'expo-router';

export default function TabsHome() {
  return <Redirect href="/tabs/library" />;
}
