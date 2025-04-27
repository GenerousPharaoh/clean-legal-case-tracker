import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  useTheme,
  Paper,
  Divider,
  StepButton,
  StepIconProps,
  styled
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { animations } from '../styles/visualRefactor';

// Define the types for step data
export interface StepData {
  label: string;
  description?: string;
  optional?: boolean;
  completed?: boolean;
  error?: boolean;
  errorMessage?: string;
  content?: React.ReactNode;
}

export interface ProgressStepperProps {
  steps: StepData[];
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'dots' | 'progress' | 'numbered';
  onStepChange?: (step: number) => void;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  allowSkip?: boolean;
  showContent?: boolean;
  disableInactiveSteps?: boolean;
  alternativeLabel?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  completeButtonText?: string;
}

// Custom step icon component
const CustomStepIcon = styled('div')<{
  completed?: boolean;
  active?: boolean;
  error?: boolean;
}>(({ theme, completed, active, error }) => ({
  display: 'flex',
  height: 22,
  alignItems: 'center',
  color: error 
    ? theme.palette.error.main 
    : completed 
      ? theme.palette.success.main 
      : active 
        ? theme.palette.primary.main 
        : theme.palette.text.disabled,
  transition: theme.transitions.create(['color'], {
    duration: theme.transitions.duration.shorter,
  }),
}));

const StepIcon = (props: StepIconProps & { error?: boolean }) => {
  const { active, completed, error, icon } = props;

  if (error) {
    return (
      <CustomStepIcon active={active} completed={completed} error={error}>
        <ErrorOutlineIcon />
      </CustomStepIcon>
    );
  }

  if (completed) {
    return (
      <CustomStepIcon active={active} completed={completed}>
        <CheckCircleOutlineIcon />
      </CustomStepIcon>
    );
  }

  if (active) {
    return (
      <CustomStepIcon active={active}>
        <RadioButtonUncheckedIcon />
      </CustomStepIcon>
    );
  }

  return (
    <CustomStepIcon>
      {typeof icon === 'number' ? icon : <RadioButtonUncheckedIcon />}
    </CustomStepIcon>
  );
};

/**
 * ProgressStepper - A component for showing step-by-step progress
 * 
 * Provides visual tracking of multi-stage processes with various
 * display options and interactive capabilities.
 */
const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  activeStep,
  orientation = 'horizontal',
  variant = 'numbered',
  onStepChange,
  onNext,
  onBack,
  onComplete,
  allowSkip = false,
  showContent = true,
  disableInactiveSteps = true,
  alternativeLabel = false,
  nextButtonText = 'Next',
  backButtonText = 'Back',
  completeButtonText = 'Complete'
}) => {
  const theme = useTheme();
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  // Handler for stepping
  const handleStep = (step: number) => () => {
    if (disableInactiveSteps && step > activeStep && !steps[step].completed) return;
    onStepChange?.(step);
  };

  // Handler for next button
  const handleNext = () => {
    onNext?.();
  };

  // Handler for back button
  const handleBack = () => {
    onBack?.();
  };

  // Handler for complete button
  const handleComplete = () => {
    onComplete?.();
  };

  // Calculate the completion percentage for the progress bar
  const completionPercentage = Math.round(
    ((steps.filter(step => step.completed).length) / steps.length) * 100
  );

  return (
    <Box sx={{ width: '100%', ...animations.fadeIn }}>
      {variant === 'progress' && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completionPercentage}%
            </Typography>
          </Box>
          <Box
            sx={{
              height: 8,
              width: '100%',
              bgcolor: theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.06)' 
                : 'rgba(255, 255, 255, 0.08)',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${completionPercentage}%`,
                bgcolor: 'primary.main',
                borderRadius: 4,
                transition: theme.transitions.create(['width'], {
                  duration: theme.transitions.duration.complex,
                }),
              }}
            />
          </Box>
        </Box>
      )}

      <Stepper 
        activeStep={activeStep} 
        orientation={orientation}
        alternativeLabel={alternativeLabel && orientation === 'horizontal'}
        nonLinear={!disableInactiveSteps}
        sx={{ mb: orientation === 'vertical' ? 0 : 4 }}
      >
        {steps.map((step, index) => {
          // Determine step state
          const stepProps: { completed?: boolean; error?: boolean } = {};
          const labelProps: { optional?: React.ReactNode; error?: boolean } = {};
          
          if (step.optional) {
            labelProps.optional = (
              <Typography variant="caption" color="text.secondary">
                Optional
              </Typography>
            );
          }
          
          if (step.error) {
            stepProps.error = true;
            labelProps.error = true;
            labelProps.optional = (
              <Typography variant="caption" color="error">
                {step.errorMessage || 'Error'}
              </Typography>
            );
          }
          
          if (step.completed) {
            stepProps.completed = true;
          }

          return (
            <Step key={step.label} {...stepProps}>
              {onStepChange ? (
                <StepButton 
                  onClick={handleStep(index)}
                  disabled={disableInactiveSteps && index > activeStep && !step.completed}
                  sx={{
                    '&.Mui-disabled': {
                      opacity: 0.6,
                    }
                  }}
                >
                  <StepLabel 
                    {...labelProps} 
                    StepIconComponent={(props) => <StepIcon {...props} error={step.error} />}
                  >
                    {step.label}
                  </StepLabel>
                </StepButton>
              ) : (
                <StepLabel 
                  {...labelProps} 
                  StepIconComponent={(props) => <StepIcon {...props} error={step.error} />}
                >
                  {step.label}
                </StepLabel>
              )}

              {orientation === 'vertical' && showContent && (
                <StepContent>
                  {step.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
                  )}
                  
                  {step.content}
                  
                  <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={isLastStep ? handleComplete : handleNext}
                      sx={{ mr: 1 }}
                    >
                      {isLastStep ? completeButtonText : nextButtonText}
                    </Button>
                    <Button
                      disabled={isFirstStep}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      {backButtonText}
                    </Button>
                    {allowSkip && index < steps.length - 1 && (
                      <Button 
                        onClick={handleNext} 
                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                      >
                        Skip
                      </Button>
                    )}
                  </Box>
                </StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>

      {orientation === 'horizontal' && activeStep < steps.length && showContent && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            mb: 3,
            ...animations.fadeIn
          }}
        >
          <Typography 
            variant="subtitle1" 
            color="primary" 
            gutterBottom
            sx={{ fontWeight: 500 }}
          >
            {steps[activeStep].label}
          </Typography>
          
          {steps[activeStep].description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {steps[activeStep].description}
            </Typography>
          )}
          
          {steps[activeStep].error && (
            <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>
              {steps[activeStep].errorMessage || 'There was an error with this step.'}
            </Typography>
          )}
          
          {steps[activeStep].content && (
            <>
              <Divider sx={{ mt: 2, mb: 3 }} />
              {steps[activeStep].content}
            </>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              disabled={isFirstStep}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              {backButtonText}
            </Button>
            {allowSkip && !isLastStep && !steps[activeStep].completed && (
              <Button 
                onClick={handleNext} 
                sx={{ textTransform: 'none', color: 'text.secondary', mr: 1 }}
              >
                Skip
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={isLastStep ? handleComplete : handleNext}
            >
              {isLastStep ? completeButtonText : nextButtonText}
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === steps.length && (
        <Paper 
          square 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            textAlign: 'center', 
            bgcolor: 'success.light',
            color: 'success.contrastText'
          }}
        >
          <Typography variant="h6" gutterBottom>
            All steps completed!
          </Typography>
          <Button onClick={() => onStepChange?.(0)} sx={{ mt: 1, mr: 1 }}>
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ProgressStepper;
