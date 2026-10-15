import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  freightService,
  AVAILABLE_QUARRIES,
  DEFAULT_QUARRY,
  PASCO_DESTINATION_PRESETS,
  type QuarryLocation,
  type DestinationPreset,
  type RouteCalculationResult,
  type LocationSuggestion,
} from '../../../shared/services/freightService';
import type { Pedido } from '../../../shared/services/ordersService';

export interface CalculatorMaterialItem {
  id: string;
  material: Pedido['material'];
  volumenM3: number;
}

export interface UseFreightCalculatorProps {
  initialMaterial?: Pedido['material'];
  initialVolumenM3?: number | '';
  initialMaterials?: Array<{ material: Pedido['material']; volumenM3: number }>;
  initialDestino?: string;
  initialQuarryId?: string;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (params: {
    destino: string;
    volumenM3: number;
    material: Pedido['material'];
    materials: Array<{ material: Pedido['material']; volumenM3: number }>;
    quarry: QuarryLocation;
    quote: RouteCalculationResult;
  }) => void;
}

export function useFreightCalculator({
  initialMaterial = 'ARENA_FINA',
  initialVolumenM3 = 15,
  initialMaterials,
  initialDestino = '',
  initialQuarryId = DEFAULT_QUARRY.id,
  isOpen,
  onClose,
  onApply,
}: UseFreightCalculatorProps) {
  const [selectedQuarry, setSelectedQuarry] = useState<QuarryLocation>(() => {
    return AVAILABLE_QUARRIES.find((q) => q.id === initialQuarryId) || DEFAULT_QUARRY;
  });

  const [materialList, setMaterialList] = useState<CalculatorMaterialItem[]>(() => {
    if (initialMaterials && initialMaterials.length > 0) {
      return initialMaterials.map((m, idx) => ({
        id: String(idx + 1),
        material: m.material,
        volumenM3: m.volumenM3,
      }));
    }
    return [
      {
        id: '1',
        material: initialMaterial,
        volumenM3: Number(initialVolumenM3) > 0 ? Number(initialVolumenM3) : 15,
      },
    ];
  });

  const [customDestino, setCustomDestino] = useState(initialDestino || 'Yanacancha (San Juan)');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quote, setQuote] = useState<RouteCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMaterial = () => {
    setMaterialList((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        material: 'PIEDRA_1_2',
        volumenM3: 15,
      },
    ]);
  };

  const handleRemoveMaterial = (id: string) => {
    if (materialList.length <= 1) return;
    setMaterialList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: 'material' | 'volumenM3', value: unknown) => {
    setMaterialList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const totalVolumenM3 = materialList.reduce((acc, curr) => acc + (Number(curr.volumenM3) || 0), 0);

  const searchAddress = useCallback(async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    setSearchingAddress(true);
    setError(null);

    try {
      const geo = await freightService.geocodeAddress(clean);
      if (geo) {
        setDestinationCoords({ lat: geo.lat, lng: geo.lng });
        return { lat: geo.lat, lng: geo.lng };
      }
      setError(`No se ubicó "${clean}" en el mapa. Selecciona una zona o haz clic en el mapa.`);
      return null;
    } catch (err: unknown) {
      console.error('Error al geocodificar:', err);
      setError('Error al buscar la dirección en el mapa.');
      return null;
    } finally {
      setSearchingAddress(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const initialText = initialDestino.trim() || 'Yanacancha (San Juan)';
    const timeoutId = window.setTimeout(() => {
      setCustomDestino(initialText);

      const preset = PASCO_DESTINATION_PRESETS.find(
        (p) =>
          p.name.toLowerCase() === initialText.toLowerCase() ||
          initialText.toLowerCase().includes(p.district.toLowerCase())
      );

      if (preset) {
        setSelectedPresetId(preset.id);
        setDestinationCoords({ lat: preset.lat, lng: preset.lng });
      } else {
        setSelectedPresetId(null);
        void searchAddress(initialText);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, initialDestino, searchAddress]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function computeQuote() {
      const destinationName = customDestino.trim() || 'Punto de Entrega';
      setQuote(null);
      setLoading(true);
      setError(null);

      try {
        let lat = destinationCoords?.lat;
        let lng = destinationCoords?.lng;

        if (lat === undefined || lng === undefined) {
          const geo = await freightService.geocodeAddress(destinationName);
          if (geo && active) {
            lat = geo.lat;
            lng = geo.lng;
            setDestinationCoords({ lat: geo.lat, lng: geo.lng });
          }
        }

        const validMaterials = materialList.map((m) => ({
          material: m.material,
          volumenM3: Number(m.volumenM3) > 0 ? Number(m.volumenM3) : 1,
        }));

        const result = await freightService.calculateFreightQuote({
          materials: validMaterials,
          destinationName,
          destinationLat: lat,
          destinationLng: lng,
          quarry: selectedQuarry,
        });

        if (active) {
          setQuote(result);
        }
      } catch (err: unknown) {
        if (active) {
          console.error('Error calculando flete:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo calcular la ruta. Verifica el punto de entrega en el mapa.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      void computeQuote();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, selectedQuarry, materialList, destinationCoords, customDestino]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!customDestino || customDestino.trim().length < 2) {
        if (!cancelled) {
          setSuggestions([]);
        }
        return;
      }

      try {
        const list = await freightService.searchDestinationSuggestions(customDestino);
        if (!cancelled) {
          setSuggestions(list);
        }
      } catch {
        // Ignorar error de sugerencias
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customDestino]);

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setDestinationCoords(coords);
    setSelectedPresetId(null);
    setCustomDestino(`Obra marcada en mapa (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    setError(null);
    setShowSuggestions(false);
  };

  const handleSelectPreset = (preset: DestinationPreset) => {
    setSelectedPresetId(preset.id);
    setDestinationCoords({ lat: preset.lat, lng: preset.lng });
    setCustomDestino(preset.name);
    setError(null);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setDestinationCoords({ lat: suggestion.lat, lng: suggestion.lng });
    setCustomDestino(suggestion.displayName);
    setSelectedPresetId(null);
    setError(null);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customDestino.trim()) return;
    setSelectedPresetId(null);
    setShowSuggestions(false);
    await searchAddress(customDestino);
  };

  const handleApply = () => {
    if (!quote || !onApply) return;
    const finalDestino = customDestino.trim() || quote.destinationName;
    const validMaterials = materialList.map((m) => ({
      material: m.material,
      volumenM3: Number(m.volumenM3) > 0 ? Number(m.volumenM3) : 1,
    }));

    onApply({
      destino: finalDestino,
      volumenM3: totalVolumenM3,
      material: validMaterials[0]?.material || 'ARENA_FINA',
      materials: validMaterials,
      quarry: selectedQuarry,
      quote,
    });
    onClose();
  };

  return {
    selectedQuarry,
    setSelectedQuarry,
    materialList,
    totalVolumenM3,
    handleAddMaterial,
    handleRemoveMaterial,
    handleUpdateMaterial,
    customDestino,
    setCustomDestino,
    destinationCoords,
    selectedPresetId,
    searchingAddress,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSelectSuggestion,
    handleSearchSubmit,
    handleSelectPreset,
    handleMapClick,
    quote,
    loading,
    error,
    handleApply,
  };
}
