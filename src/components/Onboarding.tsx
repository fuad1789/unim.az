"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Autocomplete from './Autocomplete';
import { University, UserPreferences } from '@/types';
import { getAvailableGroups } from '@/utils/dataManager';

interface OnboardingProps {
  universities: University[];
  onComplete: (preferences: UserPreferences) => void;
}

export default function Onboarding({ universities, onComplete }: OnboardingProps) {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [universityQuery, setUniversityQuery] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Filter universities based on search query
  const filteredUniversities = useMemo(() => {
    if (!universityQuery.trim()) return universities;
    
    const query = universityQuery.toLowerCase();
    return universities.filter(uni => 
      uni.name.toLowerCase().includes(query) ||
      uni.shortName?.toLowerCase().includes(query) ||
      uni.name.toLowerCase().includes(query.replace(/[əıüöçşğ]/g, (match) => {
        const map: Record<string, string> = {
          'ə': 'e', 'ı': 'i', 'ü': 'u', 'ö': 'o', 'ç': 'c', 'ş': 's', 'ğ': 'g'
        };
        return map[match] || match;
      }))
    );
  }, [universities, universityQuery]);

  // Load groups when university is selected
  useEffect(() => {
    if (selectedUniversity) {
      setIsLoadingGroups(true);
      getAvailableGroups(selectedUniversity.id)
        .then(groups => {
          setAvailableGroups(groups);
          setIsLoadingGroups(false);
        })
        .catch(error => {
          console.error('Error loading groups:', error);
          setAvailableGroups([]);
          setIsLoadingGroups(false);
        });
    } else {
      setAvailableGroups([]);
      setSelectedGroup('');
      setGroupQuery('');
    }
  }, [selectedUniversity]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!groupQuery.trim()) return availableGroups;
    
    const query = groupQuery.toLowerCase();
    return availableGroups.filter(group => 
      group.toLowerCase().includes(query)
    );
  }, [availableGroups, groupQuery]);

  const handleUniversitySelect = (university: University) => {
    setSelectedUniversity(university);
    setUniversityQuery(university.name);
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setGroupQuery(group);
  };

  const handleComplete = () => {
    if (selectedUniversity && selectedGroup) {
      onComplete({
        universityId: selectedUniversity.id,
        groupName: selectedGroup
      });
    }
  };

  const canProceed = selectedUniversity && selectedGroup;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Tələbə Köməkçisi
          </h1>
          <p className="text-gray-600">
            Universitet və qrupunuzu seçin
          </p>
        </div>

        <div className="space-y-6">
          {/* University Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Universitet
            </label>
            <Autocomplete
              items={filteredUniversities}
              onSelect={handleUniversitySelect}
              onSearch={setUniversityQuery}
              placeholder="Universitet axtar..."
              getItemKey={(uni) => uni.id.toString()}
              getItemLabel={(uni) => uni.name}
              getItemDescription={(uni) => uni.shortName || ''}
              searchQuery={universityQuery}
              setSearchQuery={setUniversityQuery}
            />
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qrup
            </label>
            <Autocomplete
              items={filteredGroups}
              onSelect={handleGroupSelect}
              onSearch={setGroupQuery}
              placeholder={selectedUniversity ? "Qrup axtar..." : "Əvvəlcə universitet seçin"}
              getItemKey={(group) => group}
              getItemLabel={(group) => group}
              searchQuery={groupQuery}
              setSearchQuery={setGroupQuery}
              isLoading={isLoadingGroups}
              disabled={!selectedUniversity}
            />
          </div>

          {/* Complete Button */}
          <motion.button
            onClick={handleComplete}
            disabled={!canProceed}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={canProceed ? { scale: 1.02 } : {}}
            whileTap={canProceed ? { scale: 0.98 } : {}}
          >
            Davam et
          </motion.button>
        </div>

        {selectedUniversity && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-blue-50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {selectedUniversity.shortName || selectedUniversity.name.split(' ').map(w => w[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium text-blue-900">
                  {selectedUniversity.name}
                </div>
                {selectedGroup && (
                  <div className="text-sm text-blue-700">
                    Qrup: {selectedGroup}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
