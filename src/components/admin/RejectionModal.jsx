import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  TextField, 
  DialogActions, 
  Button 
} from '@mui/material';

const RejectionModal = ({ restaurantName, applicantName, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onConfirm(reason.trim());
  };

  return (
    <Dialog 
      open={true} 
      onClose={onCancel}
      maxWidth="sm" 
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="text-red-600 font-bold text-xl pb-2">
        Reject Application
      </DialogTitle>
      <DialogContent>
        <DialogContentText className="mb-4 text-gray-600">
          Please provide a reason for rejecting the application for <strong>{restaurantName}</strong> by <strong>{applicantName}</strong>. This feedback will be emailed directly to the owner.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="e.g., The provided DTI registration document is blurry..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2"
        />
      </DialogContent>
      <DialogActions className="p-4 bg-gray-50 border-t border-gray-100">
        <Button onClick={onCancel} className="text-gray-600 hover:bg-gray-100 px-4 py-2">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!reason.trim()}
          variant="contained" 
          color="error"
          className="px-6 py-2 shadow-none"
        >
          Confirm Rejection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectionModal;
