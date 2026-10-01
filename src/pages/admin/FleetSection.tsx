import { VehiclesList } from '../../features/vehiculos/components/VehiclesList';
import { VehicleForm } from '../../features/vehiculos/components/VehicleForm';
import type { VehiculoConConductor } from '../../shared/services/vehiclesService';

interface FleetSectionProps {
  vehicles: VehiculoConConductor[];
  showVehicleForm: boolean;
  editingVehicle: VehiculoConConductor | null;
  onEditVehicle: (vehicle: VehiculoConConductor) => void;
  onDeleteVehicle: (id: string) => Promise<void>;
  onFormSuccess: () => Promise<void>;
  onFormCancel: () => void;
}

export function FleetSection({
  vehicles,
  showVehicleForm,
  editingVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onFormSuccess,
  onFormCancel,
}: FleetSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {showVehicleForm && (
        <div className="lg:col-span-4">
          <VehicleForm 
            onSuccess={onFormSuccess}
            onCancel={onFormCancel}
            editingVehicle={editingVehicle}
          />
        </div>
      )}
      <div className={showVehicleForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
        <VehiclesList 
          vehicles={vehicles}
          onEdit={onEditVehicle}
          onDelete={onDeleteVehicle}
        />
      </div>
    </div>
  );
}

export default FleetSection;
