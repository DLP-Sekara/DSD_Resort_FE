import { useMutation, useQuery } from '@tanstack/react-query';
import { errorToast, successToast } from '../components/common/Alert';
import paymentService from '../services/payment.services';

const paymentMutation = () => {
  const {
    getCompletedReservations,
    getBillById,
    printBill,
    downloadBill,
    getTotalIncomeByDate,
  } = paymentService();

  const getCompletedReservationsQuery = () => {
    return useQuery({
      queryKey: ['completed-reservations'],
      queryFn: () => getCompletedReservations(),
    });
  };

  const getBillByIdQuery = (id: string) => {
    return useQuery({
      queryKey: ['bill', id],
      queryFn: () => getBillById(id),
      enabled: !!id,
    });
  };

  const printBillMutation = () => {
    return useMutation({
      mutationFn: (id: string) => printBill(id),
      onSuccess: (response: any) => {
        if (response.success) {
          successToast('Print command sent successfully');
          // Depending on how backend handles print, might need to open a window
          if (response.data?.printUrl) {
            window.open(response.data.printUrl, '_blank');
          }
        } else {
          errorToast(response.message || 'Failed to print bill');
        }
      },
      onError: (error: any) => {
        errorToast(error.message || 'Failed to print bill');
      },
    });
  };

  const downloadBillMutation = () => {
    return useMutation({
      mutationFn: (id: string) => downloadBill(id),
      onSuccess: (response: any) => {
        // If it's a blob or link
        if (response instanceof Blob) {
          const url = window.URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `invoice-${Date.now()}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else if (response.success && response.data?.downloadUrl) {
          window.open(response.data.downloadUrl, '_blank');
        } else {
          // Check if response contains message
          errorToast(response.message || 'Failed to download bill');
        }
      },
      onError: (error: any) => {
        errorToast(error.message || 'Failed to download bill');
      },
    });
  };

  return {
    getCompletedReservationsQuery,
    getBillByIdQuery,
    printBillMutation,
    downloadBillMutation,
  };
};

export default paymentMutation;
