import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Container, Spinner } from 'react-bootstrap';
import { ArrowLeft, Circle, CircleFill } from 'react-bootstrap-icons';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    CandidateSummary,
    InterviewStep,
    getCandidatesByPosition,
    getInterviewFlowByPosition,
    updateCandidateStage
} from '../services/positionService';

type KanbanCandidate = CandidateSummary & { currentStepId: number };

const ScoreDots: React.FC<{ score: number }> = ({ score }) => {
    const filled = Math.min(5, Math.max(0, Math.round(score)));
    return (
        <div className="d-flex gap-1">
            {Array.from({ length: 5 }).map((_, index) =>
                index < filled ? (
                    <CircleFill key={index} className="text-success" size={12} />
                ) : (
                    <Circle key={index} className="text-success" size={12} />
                )
            )}
        </div>
    );
};

const KanbanCard: React.FC<{ candidate: KanbanCandidate }> = ({ candidate }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: String(candidate.applicationId),
        data: { candidate }
    });

    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="bg-white rounded shadow-sm p-3 mb-2"
        >
            <div className="fw-bold mb-1">{candidate.fullName}</div>
            <ScoreDots score={candidate.averageScore} />
        </div>
    );
};

const KanbanColumn: React.FC<{ step: InterviewStep; candidates: KanbanCandidate[] }> = ({ step, candidates }) => {
    const { setNodeRef, isOver } = useDroppable({ id: String(step.id) });

    return (
        <div
            ref={setNodeRef}
            className="flex-fill rounded p-3"
            style={{ minWidth: 220, backgroundColor: isOver ? '#e2e6ea' : '#f1f3f5' }}
        >
            <h6 className="fw-bold mb-3">{step.name}</h6>
            {candidates.map((candidate) => (
                <KanbanCard key={candidate.applicationId} candidate={candidate} />
            ))}
        </div>
    );
};

const PositionProcess: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const positionId = Number(id);

    const [positionName, setPositionName] = useState('');
    const [interviewSteps, setInterviewSteps] = useState<InterviewStep[]>([]);
    const [candidates, setCandidates] = useState<KanbanCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [dragError, setDragError] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        if (!id || Number.isNaN(positionId)) {
            setLoadError('Posición no válida.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError(null);

        Promise.all([getInterviewFlowByPosition(positionId), getCandidatesByPosition(positionId)])
            .then(([flow, rawCandidates]) => {
                const stepIdByName = new Map(flow.interviewSteps.map((step) => [step.name, step.id]));

                const placedCandidates: KanbanCandidate[] = rawCandidates.map((candidate) => {
                    let stepId = stepIdByName.get(candidate.currentInterviewStep);
                    if (stepId === undefined) {
                        console.error(
                            `No se encontró la fase "${candidate.currentInterviewStep}" del candidato ${candidate.fullName} entre las fases del flujo; se muestra en la primera columna.`
                        );
                        stepId = flow.interviewSteps[0]?.id;
                    }
                    return { ...candidate, currentStepId: stepId as number };
                });

                setPositionName(flow.positionName);
                setInterviewSteps(flow.interviewSteps);
                setCandidates(placedCandidates);
            })
            .catch(() => {
                setLoadError('No se pudo cargar el proceso de esta posición.');
            })
            .finally(() => setLoading(false));
    }, [id, positionId]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const candidate = active.data.current?.candidate as KanbanCandidate | undefined;
        if (!candidate) return;

        const targetStepId = Number(over.id);
        if (targetStepId === candidate.currentStepId) return;

        const previousStepId = candidate.currentStepId;

        setCandidates((prev) =>
            prev.map((c) => (c.applicationId === candidate.applicationId ? { ...c, currentStepId: targetStepId } : c))
        );
        setDragError(null);

        updateCandidateStage(candidate.id, candidate.applicationId, targetStepId).catch(() => {
            setCandidates((prev) =>
                prev.map((c) =>
                    c.applicationId === candidate.applicationId ? { ...c, currentStepId: previousStepId } : c
                )
            );
            setDragError('No se pudo actualizar la etapa del candidato. Intenta de nuevo.');
        });
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (loadError) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{loadError}</Alert>
                <Link to="/positions">Volver a posiciones</Link>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <div className="d-flex align-items-center mb-4">
                <Link to="/positions" className="me-3 text-dark" aria-label="Volver a posiciones">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="mb-0">{positionName}</h2>
            </div>

            {dragError && (
                <Alert variant="danger" dismissible onClose={() => setDragError(null)}>
                    {dragError}
                </Alert>
            )}

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="d-flex flex-column flex-md-row gap-3 overflow-x-auto">
                    {interviewSteps.map((step) => (
                        <KanbanColumn
                            key={step.id}
                            step={step}
                            candidates={candidates.filter((candidate) => candidate.currentStepId === step.id)}
                        />
                    ))}
                </div>
            </DndContext>
        </Container>
    );
};

export default PositionProcess;
