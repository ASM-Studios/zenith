import { VERSION } from '@zenith/core';
import { Screen } from '../../components/Screen.tsx';

export function HomeScreen() {
  return <Screen title="Zenith" caption={`Core ${VERSION}`} />;
}
