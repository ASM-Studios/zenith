import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Place } from './place.ts';
import { createSelectedPlaceStore } from './selected-place.ts';

const store = createSelectedPlaceStore(AsyncStorage);

type PlaceContextValue = { place: Place | null; selectPlace: (place: Place) => void };

const PlaceContext = createContext<PlaceContextValue | null>(null);

export function PlaceProvider({ children }: { children: ReactNode }) {
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    let current = true;
    void store.load().then((saved) => {
      if (current && saved !== null) {
        setPlace((chosen) => chosen ?? saved);
      }
    });
    return () => {
      current = false;
    };
  }, []);

  const selectPlace = useCallback((selected: Place) => {
    setPlace(selected);
    void store.save(selected).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ place, selectPlace }), [place, selectPlace]);
  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>;
}

export function usePlace(): PlaceContextValue {
  const value = useContext(PlaceContext);
  if (value === null) {
    throw new Error('usePlace must be used inside PlaceProvider');
  }
  return value;
}
