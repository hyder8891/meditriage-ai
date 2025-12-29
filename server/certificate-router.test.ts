import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './routers';
import * as dbCertificates from './db-certificates';

// Mock the database functions
vi.mock('./db-certificates', () => ({
  createMedicalCertificate: vi.fn(),
  getMedicalCertificatesByUserId: vi.fn(),
  getMedicalCertificateById: vi.fn(),
  updateMedicalCertificate: vi.fn(),
  deleteMedicalCertificate: vi.fn(),
  getAllMedicalCertificates: vi.fn(),
  verifyCertificate: vi.fn(),
}));

describe('Certificate Router', () => {
  const mockUser = {
    id: 1,
    openId: 'test-user',
    name: 'Dr. Test User',
    email: 'test@example.com',
    role: 'doctor' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockAdminUser = {
    ...mockUser,
    id: 2,
    role: 'admin' as const,
  };

  const mockCertificate = {
    id: 1,
    userId: 1,
    certificateType: 'medical_license',
    certificateName: 'Medical License',
    issuingOrganization: 'State Medical Board',
    certificateNumber: 'ML123456',
    issueDate: new Date('2020-01-01'),
    expiryDate: new Date('2025-01-01'),
    verificationStatus: 'pending' as const,
    verifiedBy: null,
    verifiedAt: null,
    verificationNotes: null,
    documentKey: 'cert-key',
    documentUrl: 'https://example.com/cert.pdf',
    specialty: 'Cardiology',
    country: 'USA',
    state: 'California',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new certificate for authenticated user', async () => {
      const caller = appRouter.createCaller({ user: mockUser });
      
      vi.mocked(dbCertificates.createMedicalCertificate).mockResolvedValue({ id: 1 });

      const result = await caller.certificate.create({
        certificateType: 'medical_license',
        certificateName: 'Medical License',
        issuingOrganization: 'State Medical Board',
        certificateNumber: 'ML123456',
        issueDate: '2020-01-01',
        expiryDate: '2025-01-01',
        specialty: 'Cardiology',
        country: 'USA',
        state: 'California',
        documentKey: 'cert-key',
        documentUrl: 'https://example.com/cert.pdf',
      });

      expect(result).toEqual({ id: 1 });
      expect(dbCertificates.createMedicalCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          certificateType: 'medical_license',
          certificateName: 'Medical License',
        })
      );
    });

    it('should throw error for unauthenticated user', async () => {
      const caller = appRouter.createCaller({ user: null });

      await expect(
        caller.certificate.create({
          certificateType: 'medical_license',
          certificateName: 'Medical License',
          issuingOrganization: 'State Medical Board',
          certificateNumber: 'ML123456',
          issueDate: '2020-01-01',
        })
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return certificates for authenticated user', async () => {
      const caller = appRouter.createCaller({ user: mockUser });
      
      vi.mocked(dbCertificates.getMedicalCertificatesByUserId).mockResolvedValue([mockCertificate]);

      const result = await caller.certificate.list();

      expect(result).toEqual([mockCertificate]);
      expect(dbCertificates.getMedicalCertificatesByUserId).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getById', () => {
    it('should return certificate if user owns it', async () => {
      const caller = appRouter.createCaller({ user: mockUser });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);

      const result = await caller.certificate.getById({ id: 1 });

      expect(result).toEqual(mockCertificate);
    });

    it('should throw error if user does not own certificate', async () => {
      const caller = appRouter.createCaller({ user: { ...mockUser, id: 999 } });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);

      await expect(caller.certificate.getById({ id: 1 })).rejects.toThrow('Unauthorized');
    });

    it('should allow admin to view any certificate', async () => {
      const caller = appRouter.createCaller({ user: mockAdminUser });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);

      const result = await caller.certificate.getById({ id: 1 });

      expect(result).toEqual(mockCertificate);
    });
  });

  describe('update', () => {
    it('should update certificate if user owns it', async () => {
      const caller = appRouter.createCaller({ user: mockUser });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);
      vi.mocked(dbCertificates.updateMedicalCertificate).mockResolvedValue({
        ...mockCertificate,
        certificateName: 'Updated License',
      });

      const result = await caller.certificate.update({
        id: 1,
        certificateName: 'Updated License',
      });

      expect(result.certificateName).toBe('Updated License');
      expect(dbCertificates.updateMedicalCertificate).toHaveBeenCalled();
    });

    it('should throw error if user does not own certificate', async () => {
      const caller = appRouter.createCaller({ user: { ...mockUser, id: 999 } });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);

      await expect(
        caller.certificate.update({ id: 1, certificateName: 'Updated' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('delete', () => {
    it('should delete certificate if user owns it', async () => {
      const caller = appRouter.createCaller({ user: mockUser });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);
      vi.mocked(dbCertificates.deleteMedicalCertificate).mockResolvedValue({ success: true });

      const result = await caller.certificate.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(dbCertificates.deleteMedicalCertificate).toHaveBeenCalledWith(1);
    });

    it('should throw error if user does not own certificate', async () => {
      const caller = appRouter.createCaller({ user: { ...mockUser, id: 999 } });
      
      vi.mocked(dbCertificates.getMedicalCertificateById).mockResolvedValue(mockCertificate);

      await expect(caller.certificate.delete({ id: 1 })).rejects.toThrow('Unauthorized');
    });
  });

  describe('adminList', () => {
    it('should return all certificates for admin', async () => {
      const caller = appRouter.createCaller({ user: mockAdminUser });
      
      vi.mocked(dbCertificates.getAllMedicalCertificates).mockResolvedValue([mockCertificate]);

      const result = await caller.certificate.adminList();

      expect(result).toEqual([mockCertificate]);
      expect(dbCertificates.getAllMedicalCertificates).toHaveBeenCalled();
    });

    it('should filter certificates by status', async () => {
      const caller = appRouter.createCaller({ user: mockAdminUser });
      
      vi.mocked(dbCertificates.getAllMedicalCertificates).mockResolvedValue([mockCertificate]);

      await caller.certificate.adminList({ status: 'pending' });

      expect(dbCertificates.getAllMedicalCertificates).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should throw error for non-admin user', async () => {
      const caller = appRouter.createCaller({ user: mockUser });

      await expect(caller.certificate.adminList()).rejects.toThrow();
    });
  });

  describe('verify', () => {
    it('should verify certificate as admin', async () => {
      const caller = appRouter.createCaller({ user: mockAdminUser });
      
      const verifiedCert = { ...mockCertificate, verificationStatus: 'verified' as const };
      vi.mocked(dbCertificates.verifyCertificate).mockResolvedValue(verifiedCert);

      const result = await caller.certificate.verify({
        id: 1,
        status: 'verified',
        notes: 'Verified successfully',
      });

      expect(result.verificationStatus).toBe('verified');
      expect(dbCertificates.verifyCertificate).toHaveBeenCalledWith(
        1,
        'verified',
        mockAdminUser.id,
        'Verified successfully'
      );
    });

    it('should reject certificate as admin', async () => {
      const caller = appRouter.createCaller({ user: mockAdminUser });
      
      const rejectedCert = { ...mockCertificate, verificationStatus: 'rejected' as const };
      vi.mocked(dbCertificates.verifyCertificate).mockResolvedValue(rejectedCert);

      const result = await caller.certificate.verify({
        id: 1,
        status: 'rejected',
        notes: 'Invalid document',
      });

      expect(result.verificationStatus).toBe('rejected');
    });

    it('should throw error for non-admin user', async () => {
      const caller = appRouter.createCaller({ user: mockUser });

      await expect(
        caller.certificate.verify({ id: 1, status: 'verified' })
      ).rejects.toThrow();
    });
  });
});
