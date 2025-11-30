'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Repeat, Hammer, Home, Shuffle } from 'lucide-react';

type InvestorType = 'wholesaler' | 'flipper' | 'buy_and_hold' | 'hybrid';

interface InvestorTypeOption {
  type: InvestorType;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<InvestorType | null>(null);
  const [loading, setLoading] = useState(false);

  // Type-specific preferences
  const [preferences, setPreferences] = useState({
    // Wholesaler
    targetAssignmentFee: 5000,
    minDealSize: 50000,
    // Flipper
    maxRehabBudget: 100000,
    profitTargetPercent: 20,
    // Buy-and-Hold
    targetCapRate: 8,
    targetCashFlow: 500,
  });

  const investorTypes: InvestorTypeOption[] = [
    {
      type: 'wholesaler',
      icon: <Repeat className="h-8 w-8" />,
      title: 'WHOLESALING',
      description: 'I find deals and assign contracts to other investors for an assignment fee. I don\'t buy or renovate properties.',
      color: 'border-blue-500 hover:bg-blue-50',
    },
    {
      type: 'flipper',
      icon: <Hammer className="h-8 w-8" />,
      title: 'FIX & FLIP',
      description: 'I buy distressed properties, renovate them, and sell for profit. I manage contractors and rehab budgets.',
      color: 'border-orange-500 hover:bg-orange-50',
    },
    {
      type: 'buy_and_hold',
      icon: <Home className="h-8 w-8" />,
      title: 'BUY & HOLD',
      description: 'I acquire rental properties for long-term cash flow and appreciation. I manage tenants and track returns.',
      color: 'border-green-500 hover:bg-green-50',
    },
    {
      type: 'hybrid',
      icon: <Shuffle className="h-8 w-8" />,
      title: 'HYBRID / ALL OF THE ABOVE',
      description: 'I do multiple strategies depending on the deal. Show me everything.',
      color: 'border-purple-500 hover:bg-purple-50',
    },
  ];

  const handleTypeSelect = (type: InvestorType) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (!selectedType) {
      toast({
        title: 'Selection Required',
        description: 'Please select your investor type to continue.',
        variant: 'destructive',
      });
      return;
    }
    setStep(2);
  };

  const handleSkipPreferences = async () => {
    await completeOnboarding(null);
  };

  const handleSavePreferences = async () => {
    const profile = buildInvestorProfile();
    await completeOnboarding(profile);
  };

  const buildInvestorProfile = () => {
    if (selectedType === 'wholesaler') {
      return {
        targetAssignmentFee: preferences.targetAssignmentFee,
        minDealSize: preferences.minDealSize,
      };
    } else if (selectedType === 'flipper') {
      return {
        maxRehabBudget: preferences.maxRehabBudget,
        profitTargetPercent: preferences.profitTargetPercent,
      };
    } else if (selectedType === 'buy_and_hold') {
      return {
        targetCapRate: preferences.targetCapRate,
        targetCashFlow: preferences.targetCashFlow,
      };
    } else if (selectedType === 'hybrid') {
      return {
        targetAssignmentFee: preferences.targetAssignmentFee,
        minDealSize: preferences.minDealSize,
        maxRehabBudget: preferences.maxRehabBudget,
        profitTargetPercent: preferences.profitTargetPercent,
        targetCapRate: preferences.targetCapRate,
        targetCashFlow: preferences.targetCashFlow,
      };
    }
    return null;
  };

  const completeOnboarding = async (investorProfile: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorType: selectedType,
          investorProfile,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete onboarding');
      }

      toast({
        title: 'Welcome to FlipOps!',
        description: 'Your account has been set up successfully.',
      });

      // Redirect to dashboard
      router.push('/app/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete onboarding',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Investor Type Selection
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to FlipOps!</h1>
            <p className="text-lg text-muted-foreground">
              What best describes your investing strategy?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {investorTypes.map((option) => (
              <Card
                key={option.type}
                className={`p-6 cursor-pointer transition-all border-2 ${
                  selectedType === option.type
                    ? `${option.color} ring-2 ring-offset-2`
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => handleTypeSelect(option.type)}
              >
                <div className="flex items-start space-x-4">
                  <div className="mt-1">{option.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedType}
              className="px-8"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Type-Specific Preferences
  if (step === 2 && selectedType) {
    const selectedOption = investorTypes.find((t) => t.type === selectedType);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {selectedOption?.icon}
            </div>
            <h1 className="text-3xl font-bold mb-2">{selectedOption?.title}</h1>
            <p className="text-muted-foreground">
              Customize your preferences (optional)
            </p>
          </div>

          <Card className="p-8 mb-6">
            <div className="space-y-6">
              {/* Wholesaler Preferences */}
              {(selectedType === 'wholesaler' || selectedType === 'hybrid') && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Wholesaling</h3>
                  <div>
                    <Label htmlFor="assignmentFee">Target Assignment Fee ($)</Label>
                    <Input
                      id="assignmentFee"
                      type="number"
                      value={preferences.targetAssignmentFee}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          targetAssignmentFee: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="minDealSize">Minimum Deal Size ($)</Label>
                    <Input
                      id="minDealSize"
                      type="number"
                      value={preferences.minDealSize}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          minDealSize: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Flipper Preferences */}
              {(selectedType === 'flipper' || selectedType === 'hybrid') && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Fix & Flip</h3>
                  <div>
                    <Label htmlFor="maxRehab">Maximum Rehab Budget ($)</Label>
                    <Input
                      id="maxRehab"
                      type="number"
                      value={preferences.maxRehabBudget}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          maxRehabBudget: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="profitTarget">Target Profit Percentage (%)</Label>
                    <Input
                      id="profitTarget"
                      type="number"
                      value={preferences.profitTargetPercent}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          profitTargetPercent: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Buy-and-Hold Preferences */}
              {(selectedType === 'buy_and_hold' || selectedType === 'hybrid') && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Buy & Hold</h3>
                  <div>
                    <Label htmlFor="capRate">Target Cap Rate (%)</Label>
                    <Input
                      id="capRate"
                      type="number"
                      value={preferences.targetCapRate}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          targetCapRate: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cashFlow">Target Monthly Cash Flow ($)</Label>
                    <Input
                      id="cashFlow"
                      type="number"
                      value={preferences.targetCashFlow}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          targetCashFlow: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </Button>
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={handleSkipPreferences}
                disabled={loading}
              >
                Skip
              </Button>
              <Button onClick={handleSavePreferences} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
