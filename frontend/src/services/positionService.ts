const API_BASE_URL = 'http://localhost:3010';

export type CandidateSummary = {
    id: number;
    applicationId: number;
    fullName: string;
    currentInterviewStep: string;
    averageScore: number;
};

export type InterviewStep = {
    id: number;
    interviewFlowId: number;
    interviewTypeId: number;
    name: string;
    orderIndex: number;
};

export type PositionInterviewFlow = {
    positionName: string;
    interviewSteps: InterviewStep[];
};

type InterviewFlowApiResponse = {
    interviewFlow: {
        positionName: string;
        interviewFlow: {
            id: number;
            description: string;
            interviewSteps: InterviewStep[];
        };
    };
};

export const getCandidatesByPosition = async (positionId: number): Promise<CandidateSummary[]> => {
    const response = await fetch(`${API_BASE_URL}/position/${positionId}/candidates`);
    if (!response.ok) {
        throw new Error(`Error al obtener los candidatos de la posición ${positionId}`);
    }
    return response.json();
};

export const getInterviewFlowByPosition = async (positionId: number): Promise<PositionInterviewFlow> => {
    const response = await fetch(`${API_BASE_URL}/position/${positionId}/interviewflow`);
    if (!response.ok) {
        throw new Error(`Error al obtener el flujo de entrevistas de la posición ${positionId}`);
    }
    const data: InterviewFlowApiResponse = await response.json();
    return {
        positionName: data.interviewFlow.positionName,
        interviewSteps: data.interviewFlow.interviewFlow.interviewSteps
    };
};

export const updateCandidateStage = async (
    candidateId: number,
    applicationId: number,
    currentInterviewStep: number
): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, currentInterviewStep })
    });
    if (!response.ok) {
        throw new Error(`Error al actualizar la etapa del candidato ${candidateId}`);
    }
};
