
import { db } from './firebase';
import { Agent } from '../types';

declare var firebase: any;

export const fetchAllAgents = async (): Promise<Agent[]> => {
    try {
        const agentsCollection = db.collection('usuarios');
        const agentsSnapshot = await agentsCollection.get();
        const agentsList = agentsSnapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.nombre || '',
                email: data.email || '',
                phone: data.telefono || '',
            };
        });
        return agentsList;
    } catch (error) {
        console.error("Error fetching agents:", error);
        return [];
    }
};

export const fetchAgentById = async (uid: string): Promise<Agent | null> => {
    try {
        const agentDoc = await db.collection('usuarios').doc(uid).get();
        if (agentDoc.exists) {
            const data = agentDoc.data();
            return {
                id: agentDoc.id,
                name: data.nombre || '',
                email: data.email || '',
                phone: data.telefono || '',
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching agent by ID:", error);
        return null;
    }
};

export const updateAgentProfile = async (uid: string, data: { name: string, phone: string }): Promise<void> => {
    try {
        const agentDocRef = db.collection('usuarios').doc(uid);
        await agentDocRef.update({
            nombre: data.name,
            telefono: data.phone
        });
    } catch (error) {
        console.error("Error updating agent profile:", error);
        throw new Error("No se pudo actualizar el perfil del agente.");
    }
};