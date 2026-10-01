import { OrdersList } from '../../features/pedidos/components/OrdersList';
import { OrderForm } from '../../features/pedidos/components/OrderForm';
import type { Pedido } from '../../shared/services/ordersService';

interface OrdersSectionProps {
  orders: Pedido[];
  showOrderForm: boolean;
  onAssignClick: (order: Pedido) => void;
  onCancelOrder: (id: string) => Promise<void>;
  onFormSuccess: () => Promise<void>;
  onFormCancel: () => void;
}

export function OrdersSection({
  orders,
  showOrderForm,
  onAssignClick,
  onCancelOrder,
  onFormSuccess,
  onFormCancel,
}: OrdersSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {showOrderForm && (
        <div className="lg:col-span-4">
          <OrderForm 
            onSuccess={onFormSuccess}
            onCancel={onFormCancel}
          />
        </div>
      )}
      <div className={showOrderForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
        <OrdersList 
          orders={orders}
          onAssignClick={onAssignClick}
          onCancelOrder={onCancelOrder}
          isAdmin={true}
        />
      </div>
    </div>
  );
}

export default OrdersSection;
