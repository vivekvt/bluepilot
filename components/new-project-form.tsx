'use client';

import React, { useState, useEffect } from 'react';
import { NeonGradientCard } from './magicui/neon-gradient-card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { Button } from './ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'newProjectPrompt';

export default function NewProjectForm() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load from localStorage on component mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, prompt);
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      if (!user) {
        alert('Please log in to create a project.');
        router.push(`/auth`);
        return;
      }

      const { data } = await axios.post('/api/project', { prompt });
      if (!data?.project?.id) {
        throw new Error('Project creation failed');
      }

      // Clear prompt and localStorage
      setPrompt('');
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      router.push(`/projects/${data.project.id}`);
    } catch (error) {
      setLoading(false);

      const err = error as AxiosError<{ message?: string }>;

      alert(
        err.response?.data?.message ||
          'Project creation failed. Please try again.'
      );
    }
  };

  return (
    <NeonGradientCard>
      <div className="p-3 bg-background rounded-2xl">
        <textarea
          rows={2}
          maxLength={200}
          placeholder="Describe the website you want to create..."
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 w-full px-2 p-1 border-0 bg-background resize-none focus:outline-none focus:ring-0 focus:ring-offset-0"
        />

        <Button
          disabled={loading}
          onClick={handleGenerate}
          className="gap-2 w-full mt-2"
        >
          {loading ? (
            <>
              Generating... <Loader2 className="animate-spin w-4 h-4" />
            </>
          ) : (
            <>
              Generate <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </NeonGradientCard>
  );
}
